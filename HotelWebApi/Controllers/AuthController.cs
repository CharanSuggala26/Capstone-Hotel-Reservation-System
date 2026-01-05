using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HotelWebApi.DTOs;
using HotelWebApi.Services;

namespace HotelWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CreateUserDto registerDto)
    {
        var result = await _authService.RegisterAsync(registerDto);
        if (!result.Success)
            return BadRequest(result);
        
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var result = await _authService.LoginAsync(loginDto);
        if (!result.Success)
            return BadRequest(result);
        
        return Ok(result);
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUsers()
    {
        var result = await _authService.GetAllUsersAsync();
        return Ok(result);
    }

    [HttpPut("users/roles")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserRoles([FromBody] UpdateUserRoleDto updateRoleDto)
    {
        var result = await _authService.UpdateUserRolesAsync(updateRoleDto);
        if (!result.Success)
            return BadRequest(result);
        
        return Ok(result);
    }

    [HttpGet("roles")]
    [Authorize(Roles = "Admin")]
    public IActionResult GetAvailableRoles()
    {
        var roles = new[] { "Admin", "HotelManager", "Receptionist", "Guest" };
        return Ok(new ApiResponse<string[]>
        {
            Success = true,
            Data = roles
        });
    }
}