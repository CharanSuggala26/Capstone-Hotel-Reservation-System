using HotelWebApi.DTOs;
using HotelWebApi.Models;
using HotelWebApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HotelReservationTesting;

public class AuthServiceTests
{
    private readonly Mock<UserManager<User>> _mockUserManager;
    private readonly Mock<SignInManager<User>> _mockSignInManager;
    private readonly Mock<RoleManager<IdentityRole>> _mockRoleManager;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        // Mock UserManager
        var userStore = new Mock<IUserStore<User>>();
        _mockUserManager = new Mock<UserManager<User>>(
            userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        // Mock SignInManager
        var contextAccessor = new Mock<IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<User>>();
        _mockSignInManager = new Mock<SignInManager<User>>(
            _mockUserManager.Object, contextAccessor.Object, claimsFactory.Object, null!, null!, null!, null!);

        // Mock RoleManager
        var roleStore = new Mock<IRoleStore<IdentityRole>>();
        _mockRoleManager = new Mock<RoleManager<IdentityRole>>(
            roleStore.Object, null!, null!, null!, null!);

        // Mock Configuration
        _mockConfiguration = new Mock<IConfiguration>();
        _mockConfiguration.Setup(c => c["Jwt:Key"]).Returns("ThisIsASecretKeyForTestingPurposesOnly12345"); // Must be long enough
        _mockConfiguration.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        _mockConfiguration.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");

        _authService = new AuthService(
            _mockUserManager.Object,
            _mockSignInManager.Object,
            _mockRoleManager.Object,
            _mockConfiguration.Object
        );
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnSuccess_WhenCredentialsAreValid()
    {
        var loginDto = new LoginDto { Email = "test@example.com", Password = "Password123!" };
        var user = new User { Id = "1", Email = loginDto.Email, UserName = loginDto.Email, FirstName = "Test", LastName = "User" };
        var roles = new List<string> { "Guest" };
        var claims = new List<Claim>();

        _mockUserManager.Setup(m => m.FindByEmailAsync(loginDto.Email)).ReturnsAsync(user);
        _mockSignInManager.Setup(m => m.CheckPasswordSignInAsync(user, loginDto.Password, false))
            .ReturnsAsync(SignInResult.Success);
        _mockUserManager.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(roles);
        _mockUserManager.Setup(m => m.GetClaimsAsync(user)).ReturnsAsync(claims);

        var result = await _authService.LoginAsync(loginDto);

        Assert.True(result.Success);
        Assert.Equal("Login successful", result.Message);
        Assert.NotNull(result.Token);
        Assert.Equal(loginDto.Email, result.User?.Email);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnFailure_WhenUserNotFound()
    {
        var loginDto = new LoginDto { Email = "nonexistent@example.com", Password = "Password123!" };

        _mockUserManager.Setup(m => m.FindByEmailAsync(loginDto.Email)).ReturnsAsync((User?)null);

        var result = await _authService.LoginAsync(loginDto);

        Assert.False(result.Success);
        Assert.Equal("Invalid credentials", result.Message);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnFailure_WhenPasswordIsInvalid()
    {
        var loginDto = new LoginDto { Email = "test@example.com", Password = "WrongPassword" };
        var user = new User { Id = "1", Email = loginDto.Email };

        _mockUserManager.Setup(m => m.FindByEmailAsync(loginDto.Email)).ReturnsAsync(user);
        _mockSignInManager.Setup(m => m.CheckPasswordSignInAsync(user, loginDto.Password, false))
            .ReturnsAsync(SignInResult.Failed);

        var result = await _authService.LoginAsync(loginDto);

        Assert.False(result.Success);
        Assert.Equal("Invalid credentials", result.Message);
    }

    [Fact]
    public async Task RegisterAsync_ShouldReturnSuccess_WhenUserDoesNotExist()
    {
        var registerDto = new CreateUserDto
        {
            Email = "newuser@example.com",
            Password = "Password123!",
            FirstName = "New",
            LastName = "User",
            PhoneNumber = "1234567890"
        };

        _mockUserManager.Setup(m => m.FindByEmailAsync(registerDto.Email)).ReturnsAsync((User?)null);
        _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<User>(), registerDto.Password))
            .ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(m => m.AddToRoleAsync(It.IsAny<User>(), "Guest"))
            .ReturnsAsync(IdentityResult.Success);
        
        _mockUserManager.Setup(m => m.GetRolesAsync(It.IsAny<User>()))
            .ReturnsAsync(new List<string> { "Guest" });
        _mockUserManager.Setup(m => m.GetClaimsAsync(It.IsAny<User>()))
            .ReturnsAsync(new List<Claim>());

        var result = await _authService.RegisterAsync(registerDto);

        Assert.True(result.Success);
        Assert.Equal("Registration successful", result.Message);
        Assert.NotNull(result.Token);
        Assert.Equal("Guest", result.User?.Roles.First());
    }

    [Fact]
    public async Task RegisterAsync_ShouldReturnFailure_WhenUserAlreadyExists()
    {
        var registerDto = new CreateUserDto { Email = "existing@example.com", Password = "Password123!" };
        var existingUser = new User { Email = registerDto.Email };

        _mockUserManager.Setup(m => m.FindByEmailAsync(registerDto.Email)).ReturnsAsync(existingUser);

        var result = await _authService.RegisterAsync(registerDto);

        Assert.False(result.Success);
        Assert.Equal("User already exists", result.Message);
    }

    [Fact]
    public async Task RegisterAsync_ShouldReturnFailure_WhenCreationFails()
    {
        var registerDto = new CreateUserDto { Email = "newuser@example.com", Password = "Simple" }; // weak password

        _mockUserManager.Setup(m => m.FindByEmailAsync(registerDto.Email)).ReturnsAsync((User?)null);
        _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<User>(), registerDto.Password))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Password too weak" }));

        var result = await _authService.RegisterAsync(registerDto);

        Assert.False(result.Success);
        Assert.Contains("Password too weak", result.Message);
    }

    [Fact]
    public async Task UpdateUserRolesAsync_ShouldReturnSuccess_WhenUserAndRolesExist()
    {
        var updateRoleDto = new UpdateUserRoleDto { UserId = "1", Roles = new List<string> { "Admin" } };
        var user = new User { Id = "1" };

        _mockUserManager.Setup(m => m.FindByIdAsync(updateRoleDto.UserId)).ReturnsAsync(user);
        _mockRoleManager.Setup(m => m.RoleExistsAsync("Admin")).ReturnsAsync(true);
        _mockUserManager.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { "Guest" });
        _mockUserManager.Setup(m => m.RemoveFromRolesAsync(user, It.IsAny<IEnumerable<string>>())).ReturnsAsync(IdentityResult.Success);
        _mockUserManager.Setup(m => m.AddToRolesAsync(user, updateRoleDto.Roles)).ReturnsAsync(IdentityResult.Success);

        var result = await _authService.UpdateUserRolesAsync(updateRoleDto);

        Assert.True(result.Success);
        Assert.Equal("User roles updated successfully", result.Message);
    }

    [Fact]
    public async Task UpdateUserRolesAsync_ShouldReturnFailure_WhenUserNotFound()
    {
        var updateRoleDto = new UpdateUserRoleDto { UserId = "999", Roles = new List<string> { "Admin" } };

        _mockUserManager.Setup(m => m.FindByIdAsync(updateRoleDto.UserId)).ReturnsAsync((User?)null);

        var result = await _authService.UpdateUserRolesAsync(updateRoleDto);

        Assert.False(result.Success);
        Assert.Equal("User not found", result.Message);
    }

    [Fact]
    public async Task UpdateUserRolesAsync_ShouldReturnFailure_WhenRoleDoesNotExist()
    {
        var updateRoleDto = new UpdateUserRoleDto { UserId = "1", Roles = new List<string> { "NonExistentRole" } };
        var user = new User { Id = "1" };

        _mockUserManager.Setup(m => m.FindByIdAsync(updateRoleDto.UserId)).ReturnsAsync(user);
        _mockRoleManager.Setup(m => m.RoleExistsAsync("NonExistentRole")).ReturnsAsync(false);

        var result = await _authService.UpdateUserRolesAsync(updateRoleDto);

        Assert.False(result.Success);
        Assert.Equal("Role 'NonExistentRole' does not exist", result.Message);
    }

    [Fact]
    public async Task GetAllUsersAsync_ShouldReturnListOfUsersWithRoles()
    {
        var users = new List<User>
        {
            new User { Id = "1", Email = "user1@example.com", FirstName = "User", LastName = "One" },
            new User { Id = "2", Email = "user2@example.com", FirstName = "User", LastName = "Two" }
        }.AsQueryable();

        _mockUserManager.Setup(m => m.Users).Returns(users);
        _mockUserManager.Setup(m => m.GetRolesAsync(It.IsAny<User>())).ReturnsAsync(new List<string> { "Guest" });

        var result = await _authService.GetAllUsersAsync();

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(2, result.Data.Count);
        Assert.Equal("user1@example.com", result.Data[0].Email);
        Assert.Equal("Guest", result.Data[0].Roles.First());
    }
}
