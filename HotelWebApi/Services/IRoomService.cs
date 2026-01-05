using HotelWebApi.DTOs;

namespace HotelWebApi.Services;

public interface IRoomService
{
    Task<IEnumerable<RoomDto>> GetAllRoomsAsync();
    Task<IEnumerable<RoomDto>> GetRoomsByHotelIdAsync(int hotelId);
    Task<RoomDto?> GetRoomByIdAsync(int id);
    Task<RoomDto> CreateRoomAsync(CreateRoomDto createRoomDto);
    Task<RoomDto?> UpdateRoomAsync(int id, UpdateRoomDto updateRoomDto);
    Task<bool> DeleteRoomAsync(int id);
    Task<IEnumerable<RoomDto>> GetAvailableRoomsAsync(
        DateTime checkIn,
        DateTime checkOut,
        int? hotelId);
    Task<IEnumerable<RoomDto>> GetRecommendedRoomsAsync(string userId);
}