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
        if (room == null) return basePrice * (decimal)(checkOut - checkIn).TotalDays;

        var hotelId = room.HotelId;

        var rates = await _context.SeasonalRates
            .Where(s => s.HotelId == hotelId)
            .ToListAsync();

        decimal totalPrice = 0;
        
        for (var date = checkIn; date < checkOut; date = date.AddDays(1))
        {
            // pricing also based on checkin,checkout
            var activeRates = rates.Where(r => date >= r.StartDate && date <= r.EndDate).ToList();
            
            decimal multiplier = 1.0m;
            if (activeRates.Any())
            {
             //used from seasonal pricing - Admin, Manager can set multiplier
                multiplier = activeRates.Max(r => r.Multiplier);
            }
            
            totalPrice += basePrice * multiplier;
        }

        return totalPrice;
    }
}
