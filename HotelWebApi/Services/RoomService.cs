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
    public async Task<IEnumerable<RoomDto>> GetRecommendedRoomsAsync(string userId)
    {
        // 1. Get User's Booking History
        var history = await _context.Reservations
            .Include(r => r.Room)
            .Where(r => r.UserId == userId && (r.Status == ReservationStatus.CheckedOut || r.Status == ReservationStatus.Confirmed))
            .ToListAsync();

        if (!history.Any())
        {
            // Fallback: Return some available rooms if no history
            return await _context.Rooms
                .Include(r => r.Hotel)
                .Where(r => r.Status == RoomStatus.Available)
                .Take(5)
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

        // 2. Derive Preferences
        // Preferred Room Type
        var preferredType = history
            .GroupBy(r => r.Room.Type)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefault();

        // Average Spend Per Night (approximation)
        // Note: TotalAmount usually includes days * basePrice. 
        // We really want to know roughly what 'BasePrice' tier they are in.
        // Let's assume TotalAmount / Days is effective daily rate.
        decimal avgDailySpend = 0;
        if (history.Any())
        {
            var totalSpend = history.Sum(r => r.TotalAmount);
            var totalDays = history.Sum(r => (r.CheckOutDate - r.CheckInDate).TotalDays);
            if (totalDays > 0)
                avgDailySpend = totalSpend / (decimal)totalDays;
        }

        // 3. Score Available Rooms
        var availableRooms = await _context.Rooms
            .Include(r => r.Hotel)
            .Where(r => r.Status == RoomStatus.Available)
            .ToListAsync();

        var recommendedRooms = availableRooms
            .Select(room => new
            {
                Room = room,
                Score = (room.Type == preferredType ? 10 : 0) + 
                        (Math.Abs(room.BasePrice - avgDailySpend) < 50 ? 5 : 
                         Math.Abs(room.BasePrice - avgDailySpend) < 100 ? 2 : 0)
            })
            .OrderByDescending(x => x.Score)
            .Take(5)
            .Select(x => new RoomDto
            {
                Id = x.Room.Id,
                RoomNumber = x.Room.RoomNumber,
                Type = x.Room.Type,
                BasePrice = x.Room.BasePrice,
                Capacity = x.Room.Capacity,
                Status = x.Room.Status,
                HotelId = x.Room.HotelId,
                HotelName = x.Room.Hotel.Name
            })
            .ToList();

        return recommendedRooms;
    }
}