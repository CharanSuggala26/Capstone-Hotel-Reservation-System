using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HotelWebApi.DTOs;
using HotelWebApi.Services;

namespace HotelWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,HotelManager")]
public class SeasonalRatesController : ControllerBase
{
    private readonly ISeasonalRateService _rateService;

    public SeasonalRatesController(ISeasonalRateService rateService)
    {
        _rateService = rateService;
    }

    [HttpGet("{hotelId}")]
    public async Task<IActionResult> GetRates(int hotelId)
    {
        var rates = await _rateService.GetRatesByHotelAsync(hotelId);
        return Ok(new ApiResponse<IEnumerable<SeasonalRateDto>>
        {
            Success = true,
            Data = rates
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateRate([FromBody] CreateSeasonalRateDto createDto)
    {
        var rate = await _rateService.CreateRateAsync(createDto);
        return Ok(new ApiResponse<SeasonalRateDto>
        {
            Success = true,
            Data = rate
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRate(int id)
    {
        var success = await _rateService.DeleteRateAsync(id);
        if (!success) return NotFound();
        return Ok(new ApiResponse<bool> { Success = true, Data = true });
    }
}
