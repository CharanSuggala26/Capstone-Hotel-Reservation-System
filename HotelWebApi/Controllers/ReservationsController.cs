using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using HotelWebApi.DTOs;
using HotelWebApi.Services;
using HotelWebApi.Models;

namespace HotelWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;
    private readonly Microsoft.AspNetCore.Identity.UserManager<User> _userManager;

    public ReservationsController(IReservationService reservationService, Microsoft.AspNetCore.Identity.UserManager<User> userManager)
    {
        _reservationService = reservationService;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetUserReservations()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var reservations = await _reservationService.GetUserReservationsAsync(userId);
        return Ok(reservations);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReservationDto>> GetReservation(int id)
    {
        var reservation = await _reservationService.GetReservationByIdAsync(id);
        if (reservation == null)
            return NotFound();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // allowing admin,hotelmanager and receptionist to view any reservation
        bool isStaff = User.IsInRole("Admin") || User.IsInRole("HotelManager") || User.IsInRole("Receptionist");
        
        if (reservation.UserId != userId && !isStaff)
            return Forbid();

        return Ok(reservation);
    }

    [HttpPost]
    public async Task<ActionResult<ReservationDto>> CreateReservation([FromBody] CreateReservationDto createReservationDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        //walk-in/booking for another user receptionist/admin only
        if (!string.IsNullOrEmpty(createReservationDto.GuestEmail))
        {
            bool isStaff = User.IsInRole("Admin") || User.IsInRole("Receptionist") || User.IsInRole("HotelManager");
            if (!isStaff)
            {
                return Forbid("Only staff can book for other users.");
            }

            var guestUser = await _userManager.FindByEmailAsync(createReservationDto.GuestEmail);
            if (guestUser == null)
            {
                return BadRequest($"Guest with email '{createReservationDto.GuestEmail}' not found. Please register them first.");
            }
            userId = guestUser.Id;
        }

        try
        {
            var reservation = await _reservationService.CreateReservationAsync(userId, createReservationDto);
            return CreatedAtAction(nameof(GetReservation), new { id = reservation.Id }, reservation);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ReservationDto>> UpdateReservation(int id, [FromBody] UpdateReservationDto updateReservationDto)
    {
        var existingReservation = await _reservationService.GetReservationByIdAsync(id);
        if (existingReservation == null)
            return NotFound();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // allowing admin,hotelmanager and receptionist to update any reservation
        bool isStaff = User.IsInRole("Admin") || User.IsInRole("HotelManager") || User.IsInRole("Receptionist");
        
        if (existingReservation.UserId != userId && !isStaff)
            return Forbid();

        var reservation = await _reservationService.UpdateReservationAsync(id, updateReservationDto);
        return Ok(reservation);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelReservation(int id)
    {
        var existingReservation = await _reservationService.GetReservationByIdAsync(id);
        if (existingReservation == null)
            return NotFound();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // allowing admin,hotelmanager and receptionist to cancel any reservation
        bool isStaff = User.IsInRole("Admin") || User.IsInRole("HotelManager") || User.IsInRole("Receptionist");

        if (existingReservation.UserId != userId && !isStaff)
            return Forbid();

        var result = await _reservationService.CancelReservationAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpPost("{id}/confirm")]
    [Authorize(Roles = "Admin,HotelManager")]
    public async Task<IActionResult> ConfirmReservation(int id)
    {
        var reservation = await _reservationService.GetReservationByIdAsync(id);
        if (reservation == null)
            return NotFound();

        // only hotelmanger can confirm
        var result = await _reservationService.ConfirmReservationAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpPost("{id}/checkin")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<ActionResult<ReservationDto>> CheckIn(int id)
    {
        var reservation = await _reservationService.CheckInAsync(id);
        if (reservation == null)
            return NotFound();

        return Ok(reservation);
    }

    [HttpPost("{id}/checkout")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<ActionResult<ReservationDto>> CheckOut(int id)
    {
        var reservation = await _reservationService.CheckOutAsync(id);
        if (reservation == null)
            return NotFound();

        return Ok(reservation);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin,HotelManager,Receptionist")]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAllReservations()
    {
        var reservations = await _reservationService.GetAllReservationsAsync();
        return Ok(reservations);
    }
}
