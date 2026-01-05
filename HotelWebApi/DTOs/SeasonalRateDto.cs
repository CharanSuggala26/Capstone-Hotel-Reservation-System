using System.ComponentModel.DataAnnotations;

namespace HotelWebApi.DTOs;

public class SeasonalRateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal Multiplier { get; set; }
    public int HotelId { get; set; }
}

public class CreateSeasonalRateDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
    
    [Required]
    [Range(0.1, 10.0)]
    public decimal Multiplier { get; set; }
    
    [Required]
    public int HotelId { get; set; }
}
