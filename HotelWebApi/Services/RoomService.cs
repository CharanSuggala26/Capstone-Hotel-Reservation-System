using Microsoft.EntityFrameworkCore;
using HotelWebApi.Data;
using HotelWebApi.DTOs;
using HotelWebApi.Models;

namespace HotelWebApi.Services;

public class RoomService : IRoomService
{
    private readonly HotelDbContext _context;

    public RoomService(HotelDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<RoomDto>> GetAllRoomsAsync()
    {
        return await _context.Rooms
            .Include(r => r.Hotel)
            .Select(r => new RoomDto
            {
                Id = r.Id,
                RoomNumber = r.RoomNumber,
                Type = r.Type,
                BasePrice = r.BasePrice,
                Capacity = r.Capacity,
                Status = r.Status,
                HotelId = r.HotelId,
                HotelName = r.Hotel.Name
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<RoomDto>> GetRoomsByHotelIdAsync(int hotelId)
    {
        return await _context.Rooms
            .Include(r => r.Hotel)
            .Where(r => r.HotelId == hotelId)
            .Select(r => new RoomDto
            {
                Id = r.Id,
                RoomNumber = r.RoomNumber,
                Type = r.Type,
                BasePrice = r.BasePrice,
                Capacity = r.Capacity,
                Status = r.Status,
                HotelId = r.HotelId,
                HotelName = r.Hotel.Name
            })
            .ToListAsync();
    }

    public async Task<RoomDto?> GetRoomByIdAsync(int id)
    {
        var room = await _context.Rooms
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == id);

        return room == null ? null : new RoomDto
        {
            Id = room.Id,
            RoomNumber = room.RoomNumber,
            Type = room.Type,
            BasePrice = room.BasePrice,
            Capacity = room.Capacity,
            Status = room.Status,
            HotelId = room.HotelId,
            HotelName = room.Hotel.Name
        };
    }

    public async Task<RoomDto> CreateRoomAsync(CreateRoomDto createRoomDto)
    {
        var room = new Room
        {
            RoomNumber = createRoomDto.RoomNumber,
            Type = createRoomDto.Type,
            BasePrice = createRoomDto.BasePrice,
            Capacity = createRoomDto.Capacity,
            HotelId = createRoomDto.HotelId
        };

        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();

        var hotel = await _context.Hotels.FindAsync(createRoomDto.HotelId);
        return new RoomDto
        {
            Id = room.Id,
            RoomNumber = room.RoomNumber,
            Type = room.Type,
            BasePrice = room.BasePrice,
            Capacity = room.Capacity,
            Status = room.Status,
            HotelId = room.HotelId,
            HotelName = hotel?.Name ?? ""
        };
    }

    public async Task<RoomDto?> UpdateRoomAsync(int id, UpdateRoomDto updateRoomDto)
    {
        var room = await _context.Rooms.Include(r => r.Hotel).FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) return null;

        if (!string.IsNullOrEmpty(updateRoomDto.RoomNumber))
            room.RoomNumber = updateRoomDto.RoomNumber;
        if (updateRoomDto.Type.HasValue)
            room.Type = updateRoomDto.Type.Value;
        if (updateRoomDto.BasePrice.HasValue)
            room.BasePrice = updateRoomDto.BasePrice.Value;
        if (updateRoomDto.Capacity.HasValue)
            room.Capacity = updateRoomDto.Capacity.Value;
        if (updateRoomDto.Status.HasValue)
            room.Status = updateRoomDto.Status.Value;

        await _context.SaveChangesAsync();

        return new RoomDto
        {
            Id = room.Id,
            RoomNumber = room.RoomNumber,
            Type = room.Type,
            BasePrice = room.BasePrice,
            Capacity = room.Capacity,
            Status = room.Status,
            HotelId = room.HotelId,
            HotelName = room.Hotel.Name
        };
    }

    public async Task<bool> DeleteRoomAsync(int id)
    {
        var room = await _context.Rooms.FindAsync(id);
        if (room == null) return false;

        _context.Rooms.Remove(room);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<RoomDto>> GetAvailableRoomsAsync(
    DateTime checkIn, DateTime checkOut, int? hotelId)
    {
        // Normalize dates (important)
        checkIn = checkIn.Date;
        checkOut = checkOut.Date;

        var roomsQuery = _context.Rooms
            .Include(r => r.Hotel)
            .Include(r => r.Reservations)
            .Where(r => r.Status == RoomStatus.Available)
            .AsQueryable();
        if (hotelId.HasValue)
        {
            roomsQuery = roomsQuery.Where(r => r.HotelId == hotelId.Value);
        }

        // Exclude rooms with overlapping reservations
        roomsQuery = roomsQuery.Where(r =>
            !r.Reservations.Any(res =>
                res.Status != ReservationStatus.Cancelled &&
                res.Status != ReservationStatus.CheckedOut &&
                checkIn < res.CheckOutDate &&
                checkOut > res.CheckInDate
            )
        );

        return await roomsQuery
            .Select(r => new RoomDto
            {
                Id = r.Id,
                RoomNumber = r.RoomNumber,
                Type = r.Type,
                BasePrice = r.BasePrice,
                Capacity = r.Capacity,
                Status = r.Status,
                HotelId = r.HotelId,
                HotelName = r.Hotel.Name
            })
            .ToListAsync();
    }
}