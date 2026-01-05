using HotelWebApi.DTOs;

namespace HotelWebApi.Services;

public interface ISeasonalRateService
{
    Task<IEnumerable<SeasonalRateDto>> GetRatesByHotelAsync(int hotelId);
    Task<SeasonalRateDto> CreateRateAsync(CreateSeasonalRateDto createDto);
    Task<bool> DeleteRateAsync(int id);
    Task<decimal> CalculateDynamicPriceAsync(int roomId, DateTime checkIn, DateTime checkOut, decimal basePrice);
}
