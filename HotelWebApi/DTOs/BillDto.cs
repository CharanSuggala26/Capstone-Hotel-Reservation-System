using System.ComponentModel.DataAnnotations;
using HotelWebApi.Models;

namespace HotelWebApi.DTOs;

public class BillDto
{
    public int Id { get; set; }
    public decimal RoomCharges { get; set; }
    public decimal AdditionalCharges { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public int ReservationId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public string HotelName { get; set; } = string.Empty;
    public int HotelId { get; set; }
}

public class CreateBillDto
{
    [Required, Range(0, double.MaxValue)]
    public decimal RoomCharges { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal AdditionalCharges { get; set; }
    
    [Required, Range(0, double.MaxValue)]
    public decimal TaxAmount { get; set; }
    
    [Required]
    public int ReservationId { get; set; }
}

public class UpdateBillDto
{
    [Range(0, double.MaxValue)]
    public decimal? AdditionalCharges { get; set; }
    
    public PaymentStatus? PaymentStatus { get; set; }
}

public class PaymentDto
{
    [Required]
    public int BillId { get; set; }
    
    [Required, Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
}