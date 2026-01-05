using Microsoft.EntityFrameworkCore;
using HotelWebApi.Data;
using HotelWebApi.DTOs;
using HotelWebApi.Models;

namespace HotelWebApi.Services;

public class HotelService : IHotelService
{
    private readonly HotelDbContext _context;

    public HotelService(HotelDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<HotelDto>> GetAllHotelsAsync()
    {
        return await _context.Hotels
            .Include(h => h.Rooms)
            .Select(h => new HotelDto
            {
                Id = h.Id,
                Name = h.Name,
                Address = h.Address,
                City = h.City,
                Phone = h.Phone,
                Email = h.Email,
                CreatedAt = h.CreatedAt,
                TotalRooms = h.Rooms.Count
            })
            .ToListAsync();
    }

    public async Task<HotelDto?> GetHotelByIdAsync(int id)
    {
        var hotel = await _context.Hotels
            .Include(h => h.Rooms)
            .FirstOrDefaultAsync(h => h.Id == id);

        return hotel == null ? null : new HotelDto
        {
            Id = hotel.Id,
            Name = hotel.Name,
            Address = hotel.Address,
            City = hotel.City,
            Phone = hotel.Phone,
            Email = hotel.Email,
            CreatedAt = hotel.CreatedAt,
            TotalRooms = hotel.Rooms.Count
        };
    }

    public async Task<HotelDto> CreateHotelAsync(CreateHotelDto createHotelDto)
    {
        var hotel = new Hotel
        {
            Name = createHotelDto.Name,
            Address = createHotelDto.Address,
            City = createHotelDto.City,
            Phone = createHotelDto.Phone,
            Email = createHotelDto.Email
        };

        _context.Hotels.Add(hotel);
        await _context.SaveChangesAsync();

        return new HotelDto
        {
            Id = hotel.Id,
            Name = hotel.Name,
            Address = hotel.Address,
            City = hotel.City,
            Phone = hotel.Phone,
            Email = hotel.Email,
            CreatedAt = hotel.CreatedAt,
            TotalRooms = 0
        };
    }

    public async Task<HotelDto?> UpdateHotelAsync(int id, UpdateHotelDto updateHotelDto)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null) return null;

        if (!string.IsNullOrEmpty(updateHotelDto.Name))
            hotel.Name = updateHotelDto.Name;
        if (!string.IsNullOrEmpty(updateHotelDto.Address))
            hotel.Address = updateHotelDto.Address;
        if (!string.IsNullOrEmpty(updateHotelDto.City))
            hotel.City = updateHotelDto.City;
        if (!string.IsNullOrEmpty(updateHotelDto.Phone))
            hotel.Phone = updateHotelDto.Phone;
        if (!string.IsNullOrEmpty(updateHotelDto.Email))
            hotel.Email = updateHotelDto.Email;

        await _context.SaveChangesAsync();

        return new HotelDto
        {
            Id = hotel.Id,
            Name = hotel.Name,
            Address = hotel.Address,
            City = hotel.City,
            Phone = hotel.Phone,
            Email = hotel.Email,
            CreatedAt = hotel.CreatedAt,
            TotalRooms = hotel.Rooms.Count
        };
    }

    public async Task<bool> DeleteHotelAsync(int id)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null) return false;

        _context.Hotels.Remove(hotel);
        await _context.SaveChangesAsync();
        return true;
    }
}