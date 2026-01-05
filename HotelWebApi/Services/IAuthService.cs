using HotelWebApi.DTOs;

namespace HotelWebApi.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto> RegisterAsync(CreateUserDto registerDto);
    Task<ApiResponse<List<UserWithRolesDto>>> GetAllUsersAsync();
    Task<ApiResponse<bool>> UpdateUserRolesAsync(UpdateUserRoleDto updateRoleDto);
}