using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelWebApi.Models;

public class Notification
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;

    public int? ReservationId { get; set; }
    public Reservation? Reservation { get; set; }

    [Required]
    public string Message { get; set; } = string.Empty;

    public NotificationType Type { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum NotificationType
{
    BookingConfirmation,
    CheckInReminder,
    CheckOutReminder,
    CheckInSuccess,
    CheckOutSuccess,
    BookingCancelled
}
