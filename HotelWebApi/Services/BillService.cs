using Microsoft.EntityFrameworkCore;
using HotelWebApi.Data;
using HotelWebApi.DTOs;
using HotelWebApi.Models;

namespace HotelWebApi.Services;

public class BillService : IBillService
{
    private readonly HotelDbContext _context;

    public BillService(HotelDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BillDto>> GetAllBillsAsync()
    {
        return await _context.Bills
            .Include(b => b.Reservation)
            .ThenInclude(r => r.User)
            .Include(b => b.Reservation)
            .ThenInclude(r => r.Room)
            .Select(b => new BillDto
            {
                Id = b.Id,
                RoomCharges = b.RoomCharges,
                AdditionalCharges = b.AdditionalCharges,
                TaxAmount = b.TaxAmount,
                TotalAmount = b.TotalAmount,
                PaymentStatus = b.PaymentStatus,
                CreatedAt = b.CreatedAt,
                PaidAt = b.PaidAt,
                ReservationId = b.ReservationId,
                UserName = b.Reservation.User.UserName ?? "",
                RoomNumber = b.Reservation.Room.RoomNumber,
                HotelName = b.Reservation.Room.Hotel.Name,
                HotelId = b.Reservation.Room.HotelId
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<BillDto>> GetUserBillsAsync(string userId)
    {
        return await _context.Bills
            .Include(b => b.Reservation)
            .ThenInclude(r => r.User)
            .Include(b => b.Reservation)
            .ThenInclude(r => r.Room)
            .Where(b => b.Reservation.UserId == userId)
            .Select(b => new BillDto
            {
                Id = b.Id,
                RoomCharges = b.RoomCharges,
                AdditionalCharges = b.AdditionalCharges,
                TaxAmount = b.TaxAmount,
                TotalAmount = b.TotalAmount,
                PaymentStatus = b.PaymentStatus,
                CreatedAt = b.CreatedAt,
                PaidAt = b.PaidAt,
                ReservationId = b.ReservationId,
                UserName = b.Reservation.User.UserName ?? "",
                RoomNumber = b.Reservation.Room.RoomNumber,
                HotelName = b.Reservation.Room.Hotel.Name,
                HotelId = b.Reservation.Room.HotelId
            })
            .ToListAsync();
    }

    public async Task<BillDto?> GetBillByIdAsync(int id)
    {
        var bill = await _context.Bills
            .Include(b => b.Reservation)
            .ThenInclude(r => r.User)
            .Include(b => b.Reservation)
            .ThenInclude(r => r.Room)
            .ThenInclude(rm => rm.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bill == null) return null;

        return new BillDto
        {
            Id = bill.Id,
            RoomCharges = bill.RoomCharges,
            AdditionalCharges = bill.AdditionalCharges,
            TaxAmount = bill.TaxAmount,
            TotalAmount = bill.TotalAmount,
            PaymentStatus = bill.PaymentStatus,
            CreatedAt = bill.CreatedAt,
            PaidAt = bill.PaidAt,
            ReservationId = bill.ReservationId,
            UserName = bill.Reservation.User.UserName ?? "",
            RoomNumber = bill.Reservation.Room.RoomNumber,
            HotelName = bill.Reservation.Room.Hotel.Name,
            HotelId = bill.Reservation.Room.HotelId
        };
    }

    public async Task<BillDto> CreateBillAsync(CreateBillDto createBillDto)
    {
        var reservation = await _context.Reservations.FindAsync(createBillDto.ReservationId);
        if (reservation == null)
            throw new ArgumentException("Reservation not found");

        //I'm Checking bills,if bill already exists inorder to prevent duplicate bookings
        var existingBill = await _context.Bills.FirstOrDefaultAsync(b => b.ReservationId == createBillDto.ReservationId);
        if (existingBill != null)
        {
            return await GetBillByIdAsync(existingBill.Id) ?? throw new InvalidOperationException();
        }

        var totalAmount = createBillDto.RoomCharges + createBillDto.AdditionalCharges + createBillDto.TaxAmount;

        var bill = new Bill
        {
            RoomCharges = createBillDto.RoomCharges,
            AdditionalCharges = createBillDto.AdditionalCharges,
            TaxAmount = createBillDto.TaxAmount,
            TotalAmount = totalAmount,
            ReservationId = createBillDto.ReservationId,
            PaymentStatus = PaymentStatus.Pending
        };

        _context.Bills.Add(bill);
        await _context.SaveChangesAsync();

        return await GetBillByIdAsync(bill.Id) ?? throw new InvalidOperationException();
    }

    public async Task<BillDto?> UpdateBillAsync(int id, UpdateBillDto updateBillDto)
    {
        var bill = await _context.Bills.FindAsync(id);
        if (bill == null) return null;

        if (updateBillDto.AdditionalCharges.HasValue)
        {
            bill.AdditionalCharges = updateBillDto.AdditionalCharges.Value;
            bill.TotalAmount = bill.RoomCharges + bill.AdditionalCharges + bill.TaxAmount;
        }

        if (updateBillDto.PaymentStatus.HasValue)
            bill.PaymentStatus = updateBillDto.PaymentStatus.Value;

        await _context.SaveChangesAsync();
        return await GetBillByIdAsync(id);
    }

    public async Task<BillDto?> ProcessPaymentAsync(int billId, decimal amount)
    {
        var bill = await _context.Bills.FindAsync(billId);
        if (bill == null) return null;

        if (amount >= bill.TotalAmount)
        {
            bill.PaymentStatus = PaymentStatus.Paid;
            bill.PaidAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return await GetBillByIdAsync(billId);
    }

    public async Task<bool> DeleteBillAsync(int id)
    {
        var bill = await _context.Bills.FindAsync(id);
        if (bill == null) return false;

        _context.Bills.Remove(bill);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UserOwnsBillAsync(string userId, int billId)
    {
        return await _context.Bills
            .Include(b => b.Reservation)
            .AnyAsync(b => b.Id == billId && b.Reservation.UserId == userId);
    }
}