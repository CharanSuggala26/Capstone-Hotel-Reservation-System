using HotelWebApi.DTOs;

namespace HotelWebApi.Services;

public interface IReservationService
{
    Task<IEnumerable<ReservationDto>> GetUserReservationsAsync(string userId);
    Task<ReservationDto?> GetReservationByIdAsync(int id);
    Task<ReservationDto> CreateReservationAsync(string userId, CreateReservationDto createReservationDto);
    Task<ReservationDto?> UpdateReservationAsync(int id, UpdateReservationDto updateReservationDto);
    Task<bool> CancelReservationAsync(int id);
    Task<bool> ConfirmReservationAsync(int id);
    Task<ReservationDto?> CheckInAsync(int reservationId);
    Task<ReservationDto?> CheckOutAsync(int reservationId);
    Task<IEnumerable<ReservationDto>> GetAllReservationsAsync();
}