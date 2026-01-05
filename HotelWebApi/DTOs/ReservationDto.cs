using System.ComponentModel.DataAnnotations;
using HotelWebApi.Models;

namespace HotelWebApi.DTOs;

public class ReservationDto
{
    public int Id { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public decimal TotalAmount { get; set; }
    public ReservationStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CheckedInAt { get; set; }
    public DateTime? CheckedOutAt { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string HotelName { get; set; } = string.Empty;
    public int HotelId { get; set; }
}

public class CreateReservationDto
{
    [Required]
    public DateTime CheckInDate { get; set; }
    
    [Required]
    public DateTime CheckOutDate { get; set; }
    
    [Required, Range(1, 10)]
    public int NumberOfGuests { get; set; }
    
    [Required]
    public int RoomId { get; set; }

    public string? GuestEmail { get; set; }
}

public class UpdateReservationDto
{
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    
    [Range(1, 10)]
    public int? NumberOfGuests { get; set; }
    
    public ReservationStatus? Status { get; set; }
}

public class CheckInDto
{
    [Required]
    public int ReservationId { get; set; }
}

public class CheckOutDto
{
    [Required]
    public int ReservationId { get; set; }
}