using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelWebApi.Models;

public class Bill
{
    public int Id { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal RoomCharges { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal AdditionalCharges { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal TaxAmount { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }
    
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? PaidAt { get; set; }
    
    public int ReservationId { get; set; }
    public Reservation Reservation { get; set; } = null!;
}

public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    Refunded = 3
}