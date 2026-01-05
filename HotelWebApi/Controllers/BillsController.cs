using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using HotelWebApi.DTOs;
using HotelWebApi.Services;

namespace HotelWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly IBillService _billService;

    public BillsController(IBillService billService)
    {
        _billService = billService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BillDto>>> GetUserBills()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            // admin,hotelmanager and receptionist can see all bills but regular users only their bills..
            IEnumerable<BillDto> bills;
            if (User.IsInRole("Admin") || User.IsInRole("Receptionist") || User.IsInRole("HotelManager"))
            {
                bills = await _billService.GetAllBillsAsync();
            }
            else
            {
                bills = await _billService.GetUserBillsAsync(userId);
            }
            
            return Ok(bills);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BillDto>> GetBill(int id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User not authenticated");

            var bill = await _billService.GetBillByIdAsync(id);
            if (bill == null)
                return NotFound($"Bill with ID {id} not found");

            // checking if user owns this bill
            if (!User.IsInRole("Admin") && !User.IsInRole("Receptionist") && !User.IsInRole("HotelManager") && !await _billService.UserOwnsBillAsync(userId, id))
                return Forbid("You don't have permission to access this bill");

            return Ok(bill);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<ActionResult<BillDto>> CreateBill([FromBody] CreateBillDto createBillDto)
    {
        try
        {
            var bill = await _billService.CreateBillAsync(createBillDto);
            return CreatedAtAction(nameof(GetBill), new { id = bill.Id }, bill);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BillDto>> UpdateBill(int id, [FromBody] UpdateBillDto updateBillDto)
    {
        var bill = await _billService.UpdateBillAsync(id, updateBillDto);
        if (bill == null)
            return NotFound();

        return Ok(bill);
    }

    [HttpPost("{id}/payment")]
    public async Task<ActionResult<BillDto>> ProcessPayment(int id, [FromBody] PaymentDto paymentDto)
    {
        if (id != paymentDto.BillId)
            return BadRequest("Bill ID mismatch");

        var bill = await _billService.ProcessPaymentAsync(id, paymentDto.Amount);
        if (bill == null)
            return NotFound();

        return Ok(bill);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBill(int id)
    {
        var result = await _billService.DeleteBillAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }
}