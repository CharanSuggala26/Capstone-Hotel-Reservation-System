using HotelWebApi.Models;

namespace HotelWebApi.Repositories;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<Hotel> Hotels { get; }
    IGenericRepository<Room> Rooms { get; }
    IGenericRepository<Reservation> Reservations { get; }
    IGenericRepository<Bill> Bills { get; }
    Task<int> SaveChangesAsync();
}