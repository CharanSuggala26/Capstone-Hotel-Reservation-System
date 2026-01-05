using HotelWebApi.DTOs;

namespace HotelWebApi.Services;

public interface IUserService
{
    Task<ApiResponse<PagedResult<UserDetailsDto>>> GetUsersAsync(int page = 1, int pageSize = 10, string? role = null);
    Task<ApiResponse<UserDetailsDto>> GetUserByIdAsync(string userId);
    Task<ApiResponse<bool>> UpdateUserAsync(string userId, UpdateUserDto updateDto);
    Task<ApiResponse<bool>> AssignHotelAsync(AssignHotelDto assignDto);
    Task<ApiResponse<bool>> DeleteUserAsync(string userId);
    Task<ApiResponse<IEnumerable<NotificationDto>>> GetNotificationsAsync(string userId);
    Task<ApiResponse<bool>> MarkNotificationAsReadAsync(string userId, int notificationId);
}