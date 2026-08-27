package com.expensetracker.model;

import javax.persistence.*;

@Entity
@Table(name = "users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String currency = "INR";

  private Double monthlyBudget;

  @Column(nullable = false)
  private boolean budgetAlertsEnabled = false;

  @Column(nullable = false)
  private String shakeSensitivity = "medium";

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

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

  public boolean isBudgetAlertsEnabled() {
    return budgetAlertsEnabled;
  }

  public void setBudgetAlertsEnabled(boolean budgetAlertsEnabled) {
    this.budgetAlertsEnabled = budgetAlertsEnabled;
  }

  public String getShakeSensitivity() {
    return shakeSensitivity;
  }

  public void setShakeSensitivity(String shakeSensitivity) {
    this.shakeSensitivity = shakeSensitivity;
  }
}
