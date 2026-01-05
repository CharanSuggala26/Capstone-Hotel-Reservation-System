using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HotelWebApi.DTOs;
using HotelWebApi.Services;

namespace HotelWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,HotelManager")]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? role = null)
    {
        var result = await _userService.GetUsersAsync(page, pageSize, role);
        return Ok(result);
    }

    [HttpGet("{userId}")]
    [Authorize(Roles = "Admin,HotelManager")]
    public async Task<IActionResult> GetUser(string userId)
    {
        var result = await _userService.GetUserByIdAsync(userId);
        if (!result.Success)
            return NotFound(result);
        
        return Ok(result);
    }

    [HttpPut("{userId}")]
    [Authorize(Roles = "Admin,HotelManager")]
    public async Task<IActionResult> UpdateUser(string userId, [FromBody] UpdateUserDto updateDto)
    {
        var result = await _userService.UpdateUserAsync(userId, updateDto);
        if (!result.Success)
            return BadRequest(result);
        
        return Ok(result);
    }

    [HttpPost("assign-hotel")]
    [Authorize(Roles = "Admin,HotelManager")]
    public async Task<IActionResult> AssignHotel([FromBody] AssignHotelDto assignDto)
    {
        var result = await _userService.AssignHotelAsync(assignDto);
        if (!result.Success)
            return BadRequest(result);
        
        return Ok(result);
    }

    [HttpDelete("{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var result = await _userService.DeleteUserAsync(userId);
        if (!result.Success)
            return BadRequest(result);
        
        return Ok(result);
    }

    [HttpGet("guests")]
    [Authorize(Roles = "Admin,HotelManager,Receptionist")]
    public async Task<IActionResult> GetGuests([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _userService.GetUsersAsync(page, pageSize, "Guest");
        return Ok(result);
    }

    [HttpGet("staff")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetStaff([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _userService.GetUsersAsync(page, pageSize);
        // Filter out guests
        if (result.Success && result.Data != null)
        {
            result.Data.Items = result.Data.Items
                .Where(u => !u.Roles.Contains("Guest") || u.Roles.Count > 1)
                .ToList();
        }
        return Ok(result);
    }

    [HttpPost("{userId}/promote")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PromoteUser(string userId, [FromBody] UpdateUserRoleDto roleDto)
    {
        var allowedRoles = new[] { "HotelManager", "Receptionist" };
        if (!roleDto.Roles.All(r => allowedRoles.Contains(r)))
            return BadRequest(new ApiResponse<bool> 
            { 
                Success = false, 
                Message = "Can only promote to HotelManager or Receptionist roles" 
            });

        var authService = HttpContext.RequestServices.GetRequiredService<IAuthService>();
        var updateRoleDto = new UpdateUserRoleDto { UserId = userId, Roles = roleDto.Roles };
        var result = await authService.UpdateUserRolesAsync(updateRoleDto);
        
        if (!result.Success)
            return BadRequest(result);
        
        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = "User promoted successfully",
            Data = true
        });
    }

    [HttpGet("{userId}/notifications")]
    [Authorize]
    public async Task<IActionResult> GetNotifications(string userId)
    {
        var result = await _userService.GetNotificationsAsync(userId);
        return Ok(result);
    }

    [HttpPut("{userId}/notifications/{id}/read")]
    [Authorize]
    public async Task<IActionResult> MarkNotificationRead(string userId, int id)
    {
        var result = await _userService.MarkNotificationAsReadAsync(userId, id);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}