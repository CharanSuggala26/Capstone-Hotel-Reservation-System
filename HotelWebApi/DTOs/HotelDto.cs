using System.ComponentModel.DataAnnotations;

namespace HotelWebApi.DTOs;

public class HotelDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int TotalRooms { get; set; }
}

public class CreateHotelDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Required, MaxLength(500)]
    public string Address { get; set; } = string.Empty;
    
    [Required, MaxLength(100)]
    public string City { get; set; } = string.Empty;
    
    [Required, MaxLength(20)]
    public string Phone { get; set; } = string.Empty;
    
    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; set; } = string.Empty;
}

public class UpdateHotelDto
{
    [MaxLength(200)]
    public string? Name { get; set; }
    
    [MaxLength(500)]
    public string? Address { get; set; }
    
    [MaxLength(100)]
    public string? City { get; set; }
    
    [MaxLength(20)]
    public string? Phone { get; set; }
    
    [EmailAddress, MaxLength(100)]
    public string? Email { get; set; }
}