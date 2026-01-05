using Microsoft.AspNetCore.Identity;
using HotelWebApi.Models;

namespace HotelWebApi.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<HotelDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await context.Database.EnsureCreatedAsync();

        // roles
        string[] roles = { "Admin", "HotelManager", "Receptionist", "Guest" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // users
        var users = new List<User>();
        if (await userManager.FindByEmailAsync("admin@hotel.com") == null)
        {
            var admin = new User
            {
                UserName = "admin@hotel.com",
                Email = "admin@hotel.com",
                FirstName = "System",
                LastName = "Admin",
                PhoneNumber = "+1234567890",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(admin, "Admin@123");
            await userManager.AddToRoleAsync(admin, "Admin");
            users.Add(admin);
        }

        // guest/users
        var guestEmails = new[] { "john@example.com", "jane@example.com", "bob@example.com" };
        foreach (var email in guestEmails)
        {
            if (await userManager.FindByEmailAsync(email) == null)
            {
                var user = new User
                {
                    UserName = email,
                    Email = email,
                    FirstName = email.Split('@')[0].Split('.')[0],
                    LastName = "Guest",
                    PhoneNumber = "+1987654321",
                    EmailConfirmed = true
                };
                await userManager.CreateAsync(user, "Password@123");
                await userManager.AddToRoleAsync(user, "Guest");
                users.Add(user);
            }
        }

        // hotels
        if (!context.Hotels.Any())
        {
            var hotels = new List<Hotel>
            {
                new() { Name = "Grand Plaza Hotel", Address = "123 Main St", City = "New York", Phone = "555-0101", Email = "info@grandplaza.com" },
                new() { Name = "Ocean View Resort", Address = "456 Beach Ave", City = "Miami", Phone = "555-0102", Email = "info@oceanview.com" },
                new() { Name = "Mountain Lodge", Address = "789 Hill Rd", City = "Denver", Phone = "555-0103", Email = "info@mountainlodge.com" }
            };
            context.Hotels.AddRange(hotels);
            await context.SaveChangesAsync();

            // rooms
            var rooms = new List<Room>();
            foreach (var hotel in hotels)
            {
                for (int i = 1; i <= 15; i++)
                {
                    rooms.Add(new Room
                    {
                        RoomNumber = $"{hotel.Id}{i:D3}",
                        Type = (RoomType)(i % 4 + 1),
                        BasePrice = 100 + (i % 4) * 75,
                        Capacity = i % 4 + 1,
                        Status = i % 10 == 0 ? RoomStatus.Occupied : RoomStatus.Available,
                        HotelId = hotel.Id
                    });
                }
            }
            context.Rooms.AddRange(rooms);
            await context.SaveChangesAsync();

            // reservations
            var allUsers = await userManager.GetUsersInRoleAsync("Guest");
            var allRooms = context.Rooms.ToList();
            var reservations = new List<Reservation>();

            for (int i = 0; i < 10; i++)
            {
                var user = allUsers[i % allUsers.Count];
                var room = allRooms[i % allRooms.Count];
                var checkIn = DateTime.Now.AddDays(-30 + i * 3);
                var checkOut = checkIn.AddDays(2 + i % 3);
                var nights = (checkOut - checkIn).Days;
                var totalAmount = room.BasePrice * nights;

                var reservation = new Reservation
                {
                    CheckInDate = checkIn,
                    CheckOutDate = checkOut,
                    NumberOfGuests = room.Capacity,
                    TotalAmount = totalAmount,
                    Status = i < 5 ? ReservationStatus.CheckedOut : ReservationStatus.Confirmed,
                    UserId = user.Id,
                    RoomId = room.Id,
                    CheckedInAt = i < 8 ? checkIn : null,
                    CheckedOutAt = i < 5 ? checkOut : null
                };
                reservations.Add(reservation);
            }
            context.Reservations.AddRange(reservations);
            await context.SaveChangesAsync();

            // bills
            var bills = new List<Bill>();
            foreach (var reservation in reservations.Where(r => r.Status == ReservationStatus.CheckedOut))
            {
                var roomCharges = reservation.TotalAmount;
                var additionalCharges = roomCharges * 0.1m; // 10% additional charges
                var taxAmount = (roomCharges + additionalCharges) * 0.08m; // 8% tax
                var totalAmount = roomCharges + additionalCharges + taxAmount;

                var bill = new Bill
                {
                    RoomCharges = roomCharges,
                    AdditionalCharges = additionalCharges,
                    TaxAmount = taxAmount,
                    TotalAmount = totalAmount,
                    PaymentStatus = PaymentStatus.Paid,
                    ReservationId = reservation.Id,
                    PaidAt = reservation.CheckedOutAt
                };
                bills.Add(bill);
            }
            context.Bills.AddRange(bills);
            await context.SaveChangesAsync();
        }
    }
}