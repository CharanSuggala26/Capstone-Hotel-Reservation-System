using Microsoft.EntityFrameworkCore;
using HotelWebApi.Data;
using HotelWebApi.Models;

namespace HotelWebApi.Services;

public class NotificationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

    public NotificationBackgroundService(IServiceProvider serviceProvider, ILogger<NotificationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification Background Service is starting.");

        try
        {
            await ProcessNotificationsAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during initial notification processing.");
        }

        using PeriodicTimer timer = new PeriodicTimer(_checkInterval);

        try
        {
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await ProcessNotificationsAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // I'm allowing the cancellation to go out of the inner loop
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing notifications.");
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Notification Background Service is stopping.");
        }
    }

    private async Task ProcessNotificationsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<HotelDbContext>();

        // booking confirmation notifications for users whose reservations have been confirmed after manager clicks "Confirm" button.. 
        var unconfirmedReservations = await context.Reservations
            .Where(r => r.Status == ReservationStatus.Confirmed &&
                        !context.Notifications.Any(n => n.ReservationId == r.Id && n.Type == NotificationType.BookingConfirmation))
            .ToListAsync(stoppingToken);

        foreach (var reservation in unconfirmedReservations)
        {
            var notification = new Notification
            {
                UserId = reservation.UserId,
                ReservationId = reservation.Id,
                Type = NotificationType.BookingConfirmation,
                Message = $"Your reservation for Room {reservation.RoomId} has been confirmed!",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            context.Notifications.Add(notification);
            _logger.LogInformation($"Created confirmation notification for Reservation {reservation.Id}");
        }

        // check-in reminders sending reminder if checkIn date is tomorrow and status is Confirmed my manager
        var tomorrow = DateTime.UtcNow.Date.AddDays(1);
        var today = DateTime.UtcNow.Date;

        var checkInReminders = await context.Reservations
            .Where(r => r.Status == ReservationStatus.Confirmed &&
                        r.CheckInDate.Date == tomorrow &&
                        !context.Notifications.Any(n => n.ReservationId == r.Id && n.Type == NotificationType.CheckInReminder))
            .ToListAsync(stoppingToken);

        foreach (var reservation in checkInReminders)
        {
            var notification = new Notification
            {
                UserId = reservation.UserId,
                ReservationId = reservation.Id,
                Type = NotificationType.CheckInReminder,
                Message = $"Reminder: Your check-in is scheduled for tomorrow, {reservation.CheckInDate:yyyy-MM-dd}.",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            context.Notifications.Add(notification);
            _logger.LogInformation($"Created check-in reminder for Reservation {reservation.Id}");
        }

        // check-out reminders sending reminder if checkout date is tomorrow and status is checkedin
        var checkOutReminders = await context.Reservations
            .Where(r => r.Status == ReservationStatus.CheckedIn &&
                        r.CheckOutDate.Date == tomorrow &&
                        !context.Notifications.Any(n => n.ReservationId == r.Id && n.Type == NotificationType.CheckOutReminder))
            .ToListAsync(stoppingToken);

        foreach (var reservation in checkOutReminders)
        {
            var notification = new Notification
            {
                UserId = reservation.UserId,
                ReservationId = reservation.Id,
                Type = NotificationType.CheckOutReminder,
                Message = $"Reminder: Your check-out is scheduled for tomorrow, {reservation.CheckOutDate:yyyy-MM-dd}. Please clear your dues.",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            context.Notifications.Add(notification);
            _logger.LogInformation($"Created check-out reminder for Reservation {reservation.Id}");
        }

        if (context.ChangeTracker.HasChanges())
        {
            await context.SaveChangesAsync(stoppingToken);
        }
    }
}
