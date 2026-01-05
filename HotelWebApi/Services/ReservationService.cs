using Microsoft.EntityFrameworkCore;
using HotelWebApi.Data;
using HotelWebApi.DTOs;
using HotelWebApi.Models;

namespace HotelWebApi.Services;

public class ReservationService : IReservationService
{
    private readonly HotelDbContext _context;
    private readonly ISeasonalRateService _rateService;

    public ReservationService(HotelDbContext context, ISeasonalRateService rateService)
    {
        _context = context;
        _rateService = rateService;
    }

    public async Task<IEnumerable<ReservationDto>> GetUserReservationsAsync(string userId)
    {
        return await _context.Reservations
            .Include(r => r.Room)
            .ThenInclude(r => r.Hotel)
            .Include(r => r.User)
            .Where(r => r.UserId == userId)
            .Select(r => new ReservationDto
            {
                Id = r.Id,
                CheckInDate = r.CheckInDate,
                CheckOutDate = r.CheckOutDate,
                NumberOfGuests = r.NumberOfGuests,
                TotalAmount = r.TotalAmount,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                CheckedInAt = r.CheckedInAt,
                CheckedOutAt = r.CheckedOutAt,
                UserId = r.UserId,
                UserName = $"{r.User.FirstName} {r.User.LastName}",
                RoomId = r.RoomId,
                RoomNumber = r.Room.RoomNumber,
                HotelName = r.Room.Hotel.Name,
                HotelId = r.Room.HotelId
            })
            .ToListAsync();
    }

    public async Task<ReservationDto?> GetReservationByIdAsync(int id)
    {
        var reservation = await _context.Reservations
            .Include(r => r.Room)
            .ThenInclude(r => r.Hotel)
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reservation == null) return null;

        return new ReservationDto
        {
            Id = reservation.Id,
            CheckInDate = reservation.CheckInDate,
            CheckOutDate = reservation.CheckOutDate,
            NumberOfGuests = reservation.NumberOfGuests,
            TotalAmount = reservation.TotalAmount,
            Status = reservation.Status,
            CreatedAt = reservation.CreatedAt,
            CheckedInAt = reservation.CheckedInAt,
            CheckedOutAt = reservation.CheckedOutAt,
            UserId = reservation.UserId,
            UserName = $"{reservation.User.FirstName} {reservation.User.LastName}",
            RoomId = reservation.RoomId,
            RoomNumber = reservation.Room.RoomNumber,
            HotelName = reservation.Room.Hotel.Name,
            HotelId = reservation.Room.HotelId
        };
    }

    public async Task<ReservationDto> CreateReservationAsync(string userId, CreateReservationDto createReservationDto)
    {
        var room = await _context.Rooms
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == createReservationDto.RoomId);

        if (room == null)
            throw new ArgumentException("Room not found");

        // Check for double booking
        bool isRoomOccupied = await _context.Reservations
            .AnyAsync(r => r.RoomId == createReservationDto.RoomId 
                        && r.Status != ReservationStatus.Cancelled 
                        && r.Status != ReservationStatus.CheckedOut
                        && createReservationDto.CheckInDate < r.CheckOutDate 
                        && createReservationDto.CheckOutDate > r.CheckInDate);

        if (isRoomOccupied)
            throw new ArgumentException("Room is already booked for the selected dates.");

        // Calculate dynamic price based on seasonal rates
        var totalAmount = await _rateService.CalculateDynamicPriceAsync(
            room.Id, 
            createReservationDto.CheckInDate, 
            createReservationDto.CheckOutDate, 
            room.BasePrice
        );

        var reservation = new Reservation
        {
            CheckInDate = createReservationDto.CheckInDate,
            CheckOutDate = createReservationDto.CheckOutDate,
            NumberOfGuests = createReservationDto.NumberOfGuests,
            TotalAmount = totalAmount,
            UserId = userId,
            RoomId = createReservationDto.RoomId,
            Status = ReservationStatus.Booked
        };

        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        return await GetReservationByIdAsync(reservation.Id) ?? throw new InvalidOperationException();
    }

    public async Task<ReservationDto?> UpdateReservationAsync(int id, UpdateReservationDto updateReservationDto)
    {
        var reservation = await _context.Reservations.FindAsync(id);
        if (reservation == null) return null;

        if (updateReservationDto.CheckInDate.HasValue)
            reservation.CheckInDate = updateReservationDto.CheckInDate.Value;

        if (updateReservationDto.CheckOutDate.HasValue)
            reservation.CheckOutDate = updateReservationDto.CheckOutDate.Value;

        if (updateReservationDto.NumberOfGuests.HasValue)
            reservation.NumberOfGuests = updateReservationDto.NumberOfGuests.Value;

        if (updateReservationDto.Status.HasValue)
            reservation.Status = updateReservationDto.Status.Value;

        await _context.SaveChangesAsync();
        return await GetReservationByIdAsync(id);
    }

    public async Task<bool> CancelReservationAsync(int id)
    {
        var reservation = await _context.Reservations.FindAsync(id);
        if (reservation == null) return false;
        
        if (reservation.Status == ReservationStatus.Cancelled)
            return true; // Already cancelled

        reservation.Status = ReservationStatus.Cancelled;

        // Cancel Notification
        var notification = new Notification
        {
            UserId = reservation.UserId,
            ReservationId = id,
            Type = NotificationType.BookingCancelled,
            Message = $"Your reservation for Room {reservation.RoomId} has been cancelled.",
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ConfirmReservationAsync(int id)
    {
        var reservation = await _context.Reservations.FindAsync(id);
        if (reservation == null) return false;

        reservation.Status = ReservationStatus.Confirmed;
        // Note: NotificationBackgroundService picks up Confirmed status to send BookingConfirmation notification.
        // We can also create it here immediately if we want instant feedback, but to avoid duplicates with the background service,
        // we'll rely on the background service OR check if one exists.
        // The background service checks if a notification of type BookingConfirmation exists.
        // So we can create one here safely.
        
        var notification = new Notification
        {
            UserId = reservation.UserId,
            ReservationId = id,
            Type = NotificationType.BookingConfirmation,
            Message = $"Your reservation for Room {reservation.RoomId} has been confirmed!",
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };
        
        if (!await _context.Notifications.AnyAsync(n => n.ReservationId == id && n.Type == NotificationType.BookingConfirmation))
        {
             _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ReservationDto?> CheckInAsync(int reservationId)
    {
        var reservation = await _context.Reservations.FindAsync(reservationId);
        if (reservation == null) return null;

        reservation.Status = ReservationStatus.CheckedIn;
        reservation.CheckedInAt = DateTime.UtcNow;

        // Check-in Notification
        var notification = new Notification
        {
            UserId = reservation.UserId,
            ReservationId = reservationId,
            Type = NotificationType.CheckInSuccess,
            Message = $"You have successfully checked in for Reservation {reservationId}.",
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();

        return await GetReservationByIdAsync(reservationId);
    }


    
    public async Task<ReservationDto?> CheckOutAsync(int reservationId)
    {
        var reservation = await _context.Reservations
            .Include(r => r.Room)
            .FirstOrDefaultAsync(r => r.Id == reservationId);
            
        if (reservation == null) return null;

        reservation.Status = ReservationStatus.CheckedOut;
        reservation.CheckedOutAt = DateTime.UtcNow;
        
        // Auto-generate Bill if not exists
        var existingBill = await _context.Bills.FirstOrDefaultAsync(b => b.ReservationId == reservationId);
        if (existingBill == null)
        {
            var taxAmount = reservation.TotalAmount * 0.1m; // 10% tax
            var bill = new Bill
            {
                ReservationId = reservationId,
                RoomCharges = reservation.TotalAmount,
                AdditionalCharges = 0,
                TaxAmount = taxAmount,
                TotalAmount = reservation.TotalAmount + taxAmount,
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.Bills.Add(bill);
        }

        // Check-out Notification
        var notification = new Notification
        {
            UserId = reservation.UserId,
            ReservationId = reservationId,
            Type = NotificationType.CheckOutSuccess,
            Message = $"You have successfully checked out of Room {reservation.Room.RoomNumber}. Thank you for staying with us!",
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };
        _context.Notifications.Add(notification);

        await _context.SaveChangesAsync();

        return await GetReservationByIdAsync(reservationId);
    }

    public async Task<IEnumerable<ReservationDto>> GetAllReservationsAsync()
    {
        return await _context.Reservations
            .Include(r => r.Room)
            .ThenInclude(r => r.Hotel)
            .Include(r => r.User)
            .Select(r => new ReservationDto
            {
                Id = r.Id,
                CheckInDate = r.CheckInDate,
                CheckOutDate = r.CheckOutDate,
                NumberOfGuests = r.NumberOfGuests,
                TotalAmount = r.TotalAmount,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                CheckedInAt = r.CheckedInAt,
                CheckedOutAt = r.CheckedOutAt,
                UserId = r.UserId,
                UserName = $"{r.User.FirstName} {r.User.LastName}",
                RoomId = r.RoomId,
                RoomNumber = r.Room.RoomNumber,
                HotelName = r.Room.Hotel.Name,
                HotelId = r.Room.HotelId
            })
            .ToListAsync();
    }
}
