using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HotelWebApi.DTOs;
using HotelWebApi.Services;

namespace HotelWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HotelsController : ControllerBase
{
    private readonly IHotelService _hotelService;

    public HotelsController(IHotelService hotelService)
    {
        _hotelService = hotelService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HotelDto>>> GetHotels()
    {
        var hotels = await _hotelService.GetAllHotelsAsync();
        return Ok(hotels);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HotelDto>> GetHotel(int id)
    {
        var hotel = await _hotelService.GetHotelByIdAsync(id);
        if (hotel == null)
            return NotFound();

        return Ok(hotel);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<HotelDto>> CreateHotel([FromBody] CreateHotelDto createHotelDto)
    {
        var hotel = await _hotelService.CreateHotelAsync(createHotelDto);
        return CreatedAtAction(nameof(GetHotel), new { id = hotel.Id }, hotel);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<HotelDto>> UpdateHotel(int id, [FromBody] UpdateHotelDto updateHotelDto)
    {
        var hotel = await _hotelService.UpdateHotelAsync(id, updateHotelDto);
        if (hotel == null)
            return NotFound();

        return Ok(hotel);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHotel(int id)
    {
        var result = await _hotelService.DeleteHotelAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }
}