using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HotelWebApi.DTOs;
using HotelWebApi.Models;

namespace HotelWebApi.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;

    public AuthService(UserManager<User> userManager, SignInManager<User> signInManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);
        if (user == null)
            return new AuthResponseDto { Success = false, Message = "Invalid credentials" };

        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
        if (!result.Succeeded)
            return new AuthResponseDto { Success = false, Message = "Invalid credentials" };

        var roles = await _userManager.GetRolesAsync(user);
        var userClaims = await _userManager.GetClaimsAsync(user);
        var hotelClaim = userClaims.FirstOrDefault(c => c.Type == "AssignedHotel");
        int? hotelId = hotelClaim != null && int.TryParse(hotelClaim.Value, out var hId) ? hId : null;

        var token = await GenerateJwtTokenAsync(user);
        
        return new AuthResponseDto
        {
            Success = true,
            Message = "Login successful",
            Token = token,
            Expires = DateTime.UtcNow.AddDays(7),
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                CreatedAt = user.CreatedAt,
                Roles = roles.ToList(),
                HotelId = hotelId
            }
        };
    }

    public async Task<AuthResponseDto> RegisterAsync(CreateUserDto registerDto)
    {
        var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
        if (existingUser != null)
            return new AuthResponseDto { Success = false, Message = "User already exists" };

        var user = new User
        {
            UserName = registerDto.Email,
            Email = registerDto.Email,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            PhoneNumber = registerDto.PhoneNumber
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);
        if (!result.Succeeded)
            return new AuthResponseDto { Success = false, Message = string.Join(", ", result.Errors.Select(e => e.Description)) };

        // Assign default Guest role
        await _userManager.AddToRoleAsync(user, "Guest");
        
        var token = await GenerateJwtTokenAsync(user);
        return new AuthResponseDto
        {
            Success = true,
            Message = "Registration successful",
            Token = token,
            Expires = DateTime.UtcNow.AddDays(7),
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                CreatedAt = user.CreatedAt,
                Roles = new List<string> { "Guest" }
            }
        };
    }

    public async Task<ApiResponse<List<UserWithRolesDto>>> GetAllUsersAsync()
    {
        var users = _userManager.Users.ToList();
        var usersWithRoles = new List<UserWithRolesDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            usersWithRoles.Add(new UserWithRolesDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                CreatedAt = user.CreatedAt,
                Roles = roles.ToList()
            });
        }

        return new ApiResponse<List<UserWithRolesDto>>
        {
            Success = true,
            Data = usersWithRoles
        };
    }

    public async Task<ApiResponse<bool>> UpdateUserRolesAsync(UpdateUserRoleDto updateRoleDto)
    {
        var user = await _userManager.FindByIdAsync(updateRoleDto.UserId);
        if (user == null)
            return new ApiResponse<bool> { Success = false, Message = "User not found" };

        // Validate roles exist
        foreach (var role in updateRoleDto.Roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
                return new ApiResponse<bool> { Success = false, Message = $"Role '{role}' does not exist" };
        }

        // Remove all current roles
        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);

        // Add new roles
        await _userManager.AddToRolesAsync(user, updateRoleDto.Roles);

        return new ApiResponse<bool>
        {
            Success = true,
            Message = "User roles updated successfully",
            Data = true
        };
    }

    private async Task<string> GenerateJwtTokenAsync(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
        };

        var userClaims = await _userManager.GetClaimsAsync(user);
        var hotelClaim = userClaims.FirstOrDefault(c => c.Type == "AssignedHotel");
        if (hotelClaim != null)
        {
            claims.Add(new Claim("HotelId", hotelClaim.Value));
        }

        // Add role claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}