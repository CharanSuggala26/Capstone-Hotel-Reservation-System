using System.ComponentModel.DataAnnotations;
using HotelWebApi.Models;

namespace HotelWebApi.DTOs;

public class RoomDto
{
    public int Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public RoomType Type { get; set; }
    public decimal BasePrice { get; set; }
    public int Capacity { get; set; }
    public RoomStatus Status { get; set; }
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
}

public class CreateRoomDto
{
    [Required, MaxLength(50)]
    public string RoomNumber { get; set; } = string.Empty;
    
    [Required]
    public RoomType Type { get; set; }
    
    [Required, Range(0.01, double.MaxValue)]
    public decimal BasePrice { get; set; }
    
    [Required, Range(1, 10)]
    public int Capacity { get; set; }
    
    [Required]
    public int HotelId { get; set; }
}

public class UpdateRoomDto
{
    [MaxLength(50)]
    public string? RoomNumber { get; set; }
    
    public RoomType? Type { get; set; }
    
    [Range(0.01, double.MaxValue)]
    public decimal? BasePrice { get; set; }
    
    [Range(1, 10)]
    public int? Capacity { get; set; }
    
    public RoomStatus? Status { get; set; }
}

public class RoomAvailabilityDto
{
    public int RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public RoomType Type { get; set; }
    public decimal BasePrice { get; set; }
    public int Capacity { get; set; }
    public bool IsAvailable { get; set; }
}