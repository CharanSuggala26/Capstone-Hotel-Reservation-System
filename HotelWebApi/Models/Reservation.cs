using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelWebApi.Models;

public class Reservation
{
    public int Id { get; set; }
    
    public DateTime CheckInDate { get; set; }
    
    public DateTime CheckOutDate { get; set; }
    
    public int NumberOfGuests { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }
    
    public ReservationStatus Status { get; set; } = ReservationStatus.Booked;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? CheckedInAt { get; set; }
    
    public DateTime? CheckedOutAt { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;
    
    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;
    
    public Bill? Bill { get; set; }
}

public enum ReservationStatus
{
    Booked = 1,
    Confirmed = 2,
    CheckedIn = 3,
    CheckedOut = 4,
    Cancelled = 5
}