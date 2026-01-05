using System.ComponentModel.DataAnnotations;

namespace HotelWebApi.DTOs;

public class AssignHotelDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public int HotelId { get; set; }
}

public class UpdateUserDto
{
    [MaxLength(100)]
    public string? FirstName { get; set; }
    
    [MaxLength(100)]
    public string? LastName { get; set; }
    
    [Phone]
    public string? PhoneNumber { get; set; }
}

public class UserDetailsDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
    public int? AssignedHotelId { get; set; }
    public string? AssignedHotelName { get; set; }
    public int TotalReservations { get; set; }
}