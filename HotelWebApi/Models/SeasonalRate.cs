using System.ComponentModel.DataAnnotations;

namespace HotelWebApi.Models;

public class SeasonalRate
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    public DateTime StartDate { get; set; }
    
    public DateTime EndDate { get; set; }
    
    // Multiplier for the base price. 1.0 = standard, 1.2 = +20%, 0.8 = -20%
    public decimal Multiplier { get; set; }
    
    public int HotelId { get; set; }
    public Hotel? Hotel { get; set; }
}
