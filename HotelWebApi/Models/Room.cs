using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelWebApi.Models;

public class Room
{
    public int Id { get; set; }
    
    [MaxLength(50)]
    public string RoomNumber { get; set; } = string.Empty;
    
    public RoomType Type { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal BasePrice { get; set; }
    
    public int Capacity { get; set; }
    
    public RoomStatus Status { get; set; } = RoomStatus.Available;
    
    public int HotelId { get; set; }
    public Hotel Hotel { get; set; } = null!;
    
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}

public enum RoomType
{
    Single = 1,
    Double = 2,
    Suite = 3,
    Deluxe = 4
}

public enum RoomStatus
{
    Available = 1,
    Occupied = 2,
    Maintenance = 3
}