using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HotelWebApi.DTOs;
using HotelWebApi.Models;
using HotelWebApi.Data;

namespace HotelWebApi.Services;

public class UserService : IUserService
{
    private readonly UserManager<User> _userManager;
    private readonly HotelDbContext _context;

    public UserService(UserManager<User> userManager, HotelDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<UserDetailsDto>>> GetUsersAsync(int page = 1, int pageSize = 10, string? role = null)
    {
        var query = _userManager.Users.AsQueryable();
        
        if (!string.IsNullOrEmpty(role))
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role);
            var userIds = usersInRole.Select(u => u.Id).ToList();
            query = query.Where(u => userIds.Contains(u.Id));
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userDetails = new List<UserDetailsDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var reservationCount = await _context.Reservations.CountAsync(r => r.UserId == user.Id);
            
            userDetails.Add(new UserDetailsDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt,
                Roles = roles.ToList(),
                TotalReservations = reservationCount
            });
        }

        return new ApiResponse<PagedResult<UserDetailsDto>>
        {
            Success = true,
            Data = new PagedResult<UserDetailsDto>
            {
                Items = userDetails,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            }
        };
    }

    public async Task<ApiResponse<UserDetailsDto>> GetUserByIdAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return new ApiResponse<UserDetailsDto> { Success = false, Message = "User not found" };

        var roles = await _userManager.GetRolesAsync(user);
        var reservationCount = await _context.Reservations.CountAsync(r => r.UserId == user.Id);

        return new ApiResponse<UserDetailsDto>
        {
            Success = true,
            Data = new UserDetailsDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt,
                Roles = roles.ToList(),
                TotalReservations = reservationCount
            }
        };
    }

    public async Task<ApiResponse<bool>> UpdateUserAsync(string userId, UpdateUserDto updateDto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return new ApiResponse<bool> { Success = false, Message = "User not found" };

        if (!string.IsNullOrEmpty(updateDto.FirstName))
            user.FirstName = updateDto.FirstName;
        
        if (!string.IsNullOrEmpty(updateDto.LastName))
            user.LastName = updateDto.LastName;
        
        if (!string.IsNullOrEmpty(updateDto.PhoneNumber))
            user.PhoneNumber = updateDto.PhoneNumber;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return new ApiResponse<bool> 
            { 
                Success = false, 
                Message = string.Join(", ", result.Errors.Select(e => e.Description)) 
            };

        return new ApiResponse<bool>
        {
            Success = true,
            Message = "User updated successfully",
            Data = true
        };
    }

    public async Task<ApiResponse<bool>> AssignHotelAsync(AssignHotelDto assignDto)
    {
        var user = await _userManager.FindByIdAsync(assignDto.UserId);
        if (user == null)
            return new ApiResponse<bool> { Success = false, Message = "User not found" };

        var hotel = await _context.Hotels.FindAsync(assignDto.HotelId);
        if (hotel == null)
            return new ApiResponse<bool> { Success = false, Message = "Hotel not found" };

        // For now, we'll store hotel assignment in a custom claim
        // In a real system, you might want a separate UserHotel table
        var existingClaim = await _userManager.GetClaimsAsync(user);
        var hotelClaim = existingClaim.FirstOrDefault(c => c.Type == "AssignedHotel");
        
        if (hotelClaim != null)
            await _userManager.RemoveClaimAsync(user, hotelClaim);

        await _userManager.AddClaimAsync(user, new System.Security.Claims.Claim("AssignedHotel", assignDto.HotelId.ToString()));

        return new ApiResponse<bool>
        {
            Success = true,
            Message = $"User assigned to {hotel.Name} successfully",
            Data = true
        };
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return new ApiResponse<bool> { Success = false, Message = "User not found" };

        // Check if user has active reservations
        var hasActiveReservations = await _context.Reservations
            .AnyAsync(r => r.UserId == userId && 
                          (r.Status == ReservationStatus.Booked || 
                           r.Status == ReservationStatus.Confirmed || 
                           r.Status == ReservationStatus.CheckedIn));

        if (hasActiveReservations)
            return new ApiResponse<bool> 
            { 
                Success = false, 
                Message = "Cannot delete user with active reservations" 
            };

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return new ApiResponse<bool> 
            { 
                Success = false, 
                Message = string.Join(", ", result.Errors.Select(e => e.Description)) 
            };

        return new ApiResponse<bool>
        {
            Success = true,
            Message = "User deleted successfully",
            Data = true
        };
    }

    public async Task<ApiResponse<IEnumerable<NotificationDto>>> GetNotificationsAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = DateTime.SpecifyKind(n.CreatedAt, DateTimeKind.Utc),
                ReservationId = n.ReservationId
            })
            .ToListAsync();

        return new ApiResponse<IEnumerable<NotificationDto>>
        {
            Success = true,
            Data = notifications
        };
    }

    public async Task<ApiResponse<bool>> MarkNotificationAsReadAsync(string userId, int notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            return new ApiResponse<bool> { Success = false, Message = "Notification not found" };

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return new ApiResponse<bool>
        {
            Success = true,
            Data = true
        };
    }
}