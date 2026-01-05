using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace HotelWebApi.Models;

public class User : IdentityUser
{
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}