using HotelWebApi.Data;
using HotelWebApi.DTOs;
using HotelWebApi.Models;
using HotelWebApi.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HotelReservationTesting;

public class RoomServiceTests
{
    private readonly HotelDbContext _context;
    private readonly RoomService _roomService;

    public RoomServiceTests()
    {
        var options = new DbContextOptionsBuilder<HotelDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new HotelDbContext(options);
        _roomService = new RoomService(_context);

        SeedDatabase();
    }

    private void SeedDatabase()
    {
        var hotel = new Hotel { Id = 1, Name = "Test Hotel", City = "Test City", Address="Addr", Phone="123", Email="t@t.com" };
        var room1 = new Room { Id = 1, RoomNumber = "101", Type = RoomType.Single, BasePrice = 100, Capacity = 2, Status = RoomStatus.Available, HotelId = 1 };
        var room2 = new Room { Id = 2, RoomNumber = "102", Type = RoomType.Double, BasePrice = 150, Capacity = 3, Status = RoomStatus.Available, HotelId = 1 };
        var room3 = new Room { Id = 3, RoomNumber = "103", Type = RoomType.Suite, BasePrice = 200, Capacity = 4, Status = RoomStatus.Occupied, HotelId = 1 }; // Occupied permanently (though logic usually checks reservations, this status check is also important)

        _context.Hotels.Add(hotel);
        _context.Rooms.AddRange(room1, room2, room3);
        
        var res = new Reservation 
        { 
            Id = 1, 
            RoomId = 1, 
            UserId = "user1", 
            CheckInDate = DateTime.Today.AddDays(10), 
            CheckOutDate = DateTime.Today.AddDays(15), 
            TotalAmount = 500,
            Status = ReservationStatus.Booked,
            CreatedAt = DateTime.UtcNow
        };
        _context.Reservations.Add(res);
        _context.Users.Add(new User { Id = "user1", UserName="u1", FirstName="F", LastName="L" });

        _context.SaveChanges();
    }

    [Fact]
    public async Task GetAvailableRoomsAsync_ShouldReturnAllAvailable_WhenNoOverlap()
    {
        // First i'll check dates before the existing reservation to get available rooms only
        var rooms = await _roomService.GetAvailableRoomsAsync(DateTime.Today.AddDays(1), DateTime.Today.AddDays(5), null);

        Assert.Contains(rooms, r => r.Id == 1);
        Assert.Contains(rooms, r => r.Id == 2);
        Assert.DoesNotContain(rooms, r => r.Id == 3);
    }

    [Fact]
    public async Task GetAvailableRoomsAsync_ShouldExcludeRoom_WhenReservationOverlaps()
    {
        var rooms = await _roomService.GetAvailableRoomsAsync(DateTime.Today.AddDays(12), DateTime.Today.AddDays(14), null);

        Assert.DoesNotContain(rooms, r => r.Id == 1);
        Assert.Contains(rooms, r => r.Id == 2);
    }

    [Fact]
    public async Task CreateRoomAsync_ShouldAddRoomToDatabase()
    {
        var createDto = new CreateRoomDto
        {
            RoomNumber = "201",
            Type = RoomType.Deluxe,
            BasePrice = 300,
            Capacity = 2,
            HotelId = 1
        };

        var result = await _roomService.CreateRoomAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal("201", result.RoomNumber);
        
        var dbRoom = await _context.Rooms.FindAsync(result.Id);
        Assert.NotNull(dbRoom);
    }

    [Fact]
    public async Task GetRecommendedRoomsAsync_ShouldPrioritizeUserPreferences()
    {
        // Here User1 has a booking for Room 1 - Single - 100/night
        var recommendations = await _roomService.GetRecommendedRoomsAsync("user1");

        Assert.NotEmpty(recommendations);
        var firstRec = recommendations.First();
        
        // I'm Assuming Room 1 to be top recommended because it matches Type = Single and Price approx 100
        Assert.Equal(1, firstRec.Id);
        Assert.Equal(RoomType.Single, firstRec.Type);
    }
}
