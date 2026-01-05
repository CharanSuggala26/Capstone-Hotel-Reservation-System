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
    
    public decimal Multiplier { get; set; }
    
    public int HotelId { get; set; }
    public Hotel? Hotel { get; set; }
}
