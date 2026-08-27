package com.expensetracker.dto;

public class SettingsRequest {

  private String name;
  private String currency;
  private Double monthlyBudget;
  private Boolean budgetAlertsEnabled;
  private String shakeSensitivity;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public Double getMonthlyBudget() {
    return monthlyBudget;
  }

  public void setMonthlyBudget(Double monthlyBudget) {
    this.monthlyBudget = monthlyBudget;
  }

  public Boolean getBudgetAlertsEnabled() {
    return budgetAlertsEnabled;
  }

  public void setBudgetAlertsEnabled(Boolean budgetAlertsEnabled) {
    this.budgetAlertsEnabled = budgetAlertsEnabled;
  }

  public String getShakeSensitivity() {
    return shakeSensitivity;
  }

  public void setShakeSensitivity(String shakeSensitivity) {
    this.shakeSensitivity = shakeSensitivity;
  }
}
