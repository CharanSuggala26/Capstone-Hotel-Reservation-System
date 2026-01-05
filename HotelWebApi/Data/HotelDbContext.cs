using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using HotelWebApi.Models;

namespace HotelWebApi.Data;

public class HotelDbContext : IdentityDbContext<User>
{
    public HotelDbContext(DbContextOptions<HotelDbContext> options) : base(options) { }

    public DbSet<Hotel> Hotels { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Reservation> Reservations { get; set; }
    public DbSet<Bill> Bills { get; set; }
    public DbSet<SeasonalRate> SeasonalRates { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Hotel 
        builder.Entity<Hotel>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.HasMany(h => h.Rooms)
                  .WithOne(r => r.Hotel)
                  .HasForeignKey(r => r.HotelId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Room 
        builder.Entity<Room>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.BasePrice)
                  .HasColumnType("decimal(10,2)");
            entity.HasMany(r => r.Reservations)
                  .WithOne(res => res.Room)
                  .HasForeignKey(res => res.RoomId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Reservation 
        builder.Entity<Reservation>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.TotalAmount)
                  .HasColumnType("decimal(10,2)");
            entity.HasOne(r => r.User)
                  .WithMany(u => u.Reservations)
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(r => r.Bill)
                  .WithOne(b => b.Reservation)
                  .HasForeignKey<Bill>(b => b.ReservationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Bill 
        builder.Entity<Bill>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.RoomCharges)
                  .HasColumnType("decimal(10,2)");
            entity.Property(b => b.AdditionalCharges)
                  .HasColumnType("decimal(10,2)");
            entity.Property(b => b.TaxAmount)
                  .HasColumnType("decimal(10,2)");
            entity.Property(b => b.TotalAmount)
                  .HasColumnType("decimal(10,2)");
        });

        // SeasonalRate 
        builder.Entity<SeasonalRate>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Multiplier)
                  .HasColumnType("decimal(4,2)"); // e.g., 1.50
            entity.HasOne(s => s.Hotel)
                  .WithMany()
                  .HasForeignKey(s => s.HotelId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Notification 
        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.HasOne(n => n.User)
                  .WithMany()
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(n => n.Reservation)
                  .WithMany()
                  .HasForeignKey(n => n.ReservationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}