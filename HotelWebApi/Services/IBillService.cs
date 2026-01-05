using HotelWebApi.DTOs;

namespace HotelWebApi.Services;

public interface IBillService
{
    Task<IEnumerable<BillDto>> GetAllBillsAsync();
    Task<IEnumerable<BillDto>> GetUserBillsAsync(string userId);
    Task<BillDto?> GetBillByIdAsync(int id);
    Task<BillDto> CreateBillAsync(CreateBillDto createBillDto);
    Task<BillDto?> UpdateBillAsync(int id, UpdateBillDto updateBillDto);
    Task<BillDto?> ProcessPaymentAsync(int billId, decimal amount);
    Task<bool> DeleteBillAsync(int id);
    Task<bool> UserOwnsBillAsync(string userId, int billId);
}