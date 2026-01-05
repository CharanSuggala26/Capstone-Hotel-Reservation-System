using HotelWebApi.DTOs;
using HotelWebApi.Models;
using HotelWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoomDto>>> GetRooms([FromQuery] int? hotelId)
    {
        var rooms = hotelId.HasValue 
            ? await _roomService.GetRoomsByHotelIdAsync(hotelId.Value)
            : await _roomService.GetAllRoomsAsync();
        return Ok(rooms);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoomDto>> GetRoom(int id)
    {
        var room = await _roomService.GetRoomByIdAsync(id);
        if (room == null)
            return NotFound();

        return Ok(room);
    }

    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<RoomDto>>> GetAvailableRooms(
    [FromQuery] DateTime checkIn,
    [FromQuery] DateTime checkOut,
    [FromQuery] int? hotelId)
    {
        var rooms = await _roomService.GetAvailableRoomsAsync(checkIn, checkOut, hotelId);
        return Ok(rooms);
    }

    [HttpGet("recommendations")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RoomDto>>> GetRecommendedRooms()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var rooms = await _roomService.GetRecommendedRoomsAsync(userId);
        return Ok(rooms);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RoomDto>> CreateRoom([FromBody] CreateRoomDto createRoomDto)
    {
        var room = await _roomService.CreateRoomAsync(createRoomDto);
        return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, room);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RoomDto>> UpdateRoom(int id, [FromBody] UpdateRoomDto updateRoomDto)
    {
        var room = await _roomService.UpdateRoomAsync(id, updateRoomDto);
        if (room == null)
            return NotFound();

        return Ok(room);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteRoom(int id)
    {
        var result = await _roomService.DeleteRoomAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }
}