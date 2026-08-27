package com.expensetracker.dto;

import javax.validation.constraints.*;

public class ExpenseRequest {
  @NotBlank
  private String date;

  @NotBlank
  @Size(max = 200)
  private String description;

  @NotBlank
  private String category;

  @Positive
  private double amount;

  public String getDate() { return date; }
  public void setDate(String date) { this.date = date; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public double getAmount() { return amount; }
  public void setAmount(double amount) { this.amount = amount; }
}
