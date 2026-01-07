using Microsoft.EntityFrameworkCore;
using HotelWebApi.Data;
using HotelWebApi.DTOs;
using HotelWebApi.Models;

namespace HotelWebApi.Services;

public class SeasonalRateService : ISeasonalRateService
{
    private readonly HotelDbContext _context;

    public SeasonalRateService(HotelDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SeasonalRateDto>> GetRatesByHotelAsync(int hotelId)
    {
        return await _context.SeasonalRates
            .Where(s => s.HotelId == hotelId)
            .OrderBy(s => s.StartDate)
            .Select(s => new SeasonalRateDto
            {
                Id = s.Id,
                Name = s.Name,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                Multiplier = s.Multiplier,
                HotelId = s.HotelId
            })
            .ToListAsync();
    }

    public async Task<SeasonalRateDto> CreateRateAsync(CreateSeasonalRateDto createDto)
    {
        var rate = new SeasonalRate
        {
            Name = createDto.Name,
            StartDate = createDto.StartDate,
            EndDate = createDto.EndDate,
            Multiplier = createDto.Multiplier,
            HotelId = createDto.HotelId
        };

        _context.SeasonalRates.Add(rate);
        await _context.SaveChangesAsync();

        return new SeasonalRateDto
        {
            Id = rate.Id,
            Name = rate.Name,
            StartDate = rate.StartDate,
            EndDate = rate.EndDate,
            Multiplier = rate.Multiplier,
            HotelId = rate.HotelId
        };
    }

    public async Task<bool> DeleteRateAsync(int id)
    {
        var rate = await _context.SeasonalRates.FindAsync(id);
        if (rate == null) return false;

        _context.SeasonalRates.Remove(rate);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> CalculateDynamicPriceAsync(int roomId, DateTime checkIn, DateTime checkOut, decimal basePrice)
    {
        var room = await _context.Rooms.FindAsync(roomId);
        // Fallback or invalid duration
        var days = (decimal)(checkOut - checkIn).TotalDays;
        if (days < 1) days = 1;
        
        if (room == null) return basePrice * days;

        var hotelId = room.HotelId;

        // Force check-in/out to purely date (midnight)
        var current = checkIn.Date;
        var end = checkOut.Date;
        
        // Handle edge case where same-day booking implies 1 night
        if (end <= current) end = current.AddDays(1);

        // Fetch ONLY rates that overlap with the requested period
        // Rate Start < Booking End AND Rate End >= Booking Start (general overlap)
        // Note: Booking ends at 'end', so rate must start strictly before 'end'.
        var rates = await _context.SeasonalRates
            .Where(s => s.HotelId == hotelId && s.StartDate < end && s.EndDate >= current)
            .ToListAsync();

        decimal totalPrice = 0;
        
        while (current < end)
        {
            // Calculate effective price for THIS specific day/night 'current'
            var activeRates = rates.Where(r => 
                current >= r.StartDate.Date && 
                current <= r.EndDate.Date
            ).ToList();
            
            decimal multiplier = 1.0m;
            if (activeRates.Any())
            {
                // used from seasonal pricing - Admin, Manager can set multiplier
                // Takes the highest multiplier if multiple overlapping rules exist (e.g. holiday + weekend)
                multiplier = activeRates.Max(r => r.Multiplier);
            }
            
            totalPrice += basePrice * multiplier;
            current = current.AddDays(1);
        }

        return totalPrice;
    }
}
