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
        // Simple overlap check? For now, we allow overlaps and take MAX multiplier
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
        // Fetch rates overlapping with the date range for the room's hotel
        // 1. Get HotelId from RoomId
        // This helper assumes the caller might not know HotelId, but knowing it is better.
        // Let's optimize: fetch room's hotel ID inside here.
        
        var room = await _context.Rooms.FindAsync(roomId);
        if (room == null) return basePrice * (decimal)(checkOut - checkIn).TotalDays;

        var hotelId = room.HotelId;

        // Fetch all rates for this hotel
        var rates = await _context.SeasonalRates
            .Where(s => s.HotelId == hotelId)
            .ToListAsync();

        decimal totalPrice = 0;
        
        for (var date = checkIn; date < checkOut; date = date.AddDays(1))
        {
            // Find applicable rates for this specific date
            var activeRates = rates.Where(r => date >= r.StartDate && date <= r.EndDate).ToList();
            
            decimal multiplier = 1.0m;
            if (activeRates.Any())
            {
                // Logic: take the highest multiplier if multiple overlap (e.g. holiday inside summer)
                // Or multiply them? Usually MAX is safer to avoid insane prices.
                multiplier = activeRates.Max(r => r.Multiplier);
            }
            
            totalPrice += basePrice * multiplier;
        }

        return totalPrice;
    }
}
