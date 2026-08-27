package com.expensetracker.service;

import com.expensetracker.dto.ExpenseRequest;
import com.expensetracker.dto.LoginRequest;
import com.expensetracker.dto.SettingsRequest;
import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class AppService {

  private static final Set<String> CATEGORIES = new HashSet<String>(Arrays.asList(
      "Food", "Travel", "Shopping", "Bills", "Health", "Entertainment", "Other"
  ));

  private final UserRepository userRepository;
  private final ExpenseRepository expenseRepository;
  private final JwtService jwtService;

  public AppService(UserRepository userRepository, ExpenseRepository expenseRepository, JwtService jwtService) {
    this.userRepository = userRepository;
    this.expenseRepository = expenseRepository;
    this.jwtService = jwtService;
  }

  @Transactional
  public Map<String, Object> login(LoginRequest req) {
    String email = req.getEmail().trim().toLowerCase(Locale.ROOT);
    User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
    if (user == null) {
      user = new User();
      user.setEmail(email);
      user.setName(displayName(email, req.getName()));
      user = userRepository.save(user);
    } else if (req.getName() != null && !req.getName().trim().isEmpty()) {
      user.setName(req.getName().trim());
      user = userRepository.save(user);
    }

    String token = jwtService.createToken(user.getId(), user.getEmail());
    Map<String, Object> body = new HashMap<String, Object>();
    body.put("token", token);
    body.put("user", toUserMap(user));
    return body;
  }

  public Map<String, Object> me(User user) {
    return toUserMap(user);
  }

  @Transactional
  public Map<String, Object> updateSettings(User user, SettingsRequest req) {
    if (req.getName() != null && !req.getName().trim().isEmpty()) {
      user.setName(req.getName().trim());
    }
    if (req.getCurrency() != null && !req.getCurrency().trim().isEmpty()) {
      user.setCurrency(req.getCurrency().trim().toUpperCase(Locale.ROOT));
    }
    if (req.getMonthlyBudget() != null) {
      user.setMonthlyBudget(req.getMonthlyBudget() <= 0 ? null : req.getMonthlyBudget());
    }
    if (req.getBudgetAlertsEnabled() != null) {
      user.setBudgetAlertsEnabled(req.getBudgetAlertsEnabled());
    }
    if (req.getShakeSensitivity() != null) {
      String s = req.getShakeSensitivity().trim().toLowerCase(Locale.ROOT);
      if (!Arrays.asList("low", "medium", "high").contains(s)) {
        throw new IllegalArgumentException("Invalid shake sensitivity");
      }
      user.setShakeSensitivity(s);
    }
    return toUserMap(userRepository.save(user));
  }

  public List<Map<String, Object>> listExpenses(User user) {
    List<Expense> list = expenseRepository.findByUserOrderByDateDescCreatedAtDesc(user);
    List<Map<String, Object>> out = new ArrayList<Map<String, Object>>();
    for (Expense e : list) {
      out.add(toExpenseMap(e));
    }
    return out;
  }

  @Transactional
  public Map<String, Object> createExpense(User user, ExpenseRequest req) {
    Expense e = new Expense();
    e.setRowId(UUID.randomUUID().toString());
    e.setUser(user);
    applyExpense(e, req);
    e.setCreatedAt(Instant.now());
    return toExpenseMap(expenseRepository.save(e));
  }

  @Transactional
  public Map<String, Object> updateExpense(User user, String rowId, ExpenseRequest req) {
    Expense e = expenseRepository.findByRowIdAndUser(rowId, user)
        .orElseThrow(() -> new IllegalArgumentException("Expense not found"));
    applyExpense(e, req);
    return toExpenseMap(expenseRepository.save(e));
  }

  @Transactional
  public void deleteExpense(User user, String rowId) {
    Expense e = expenseRepository.findByRowIdAndUser(rowId, user)
        .orElseThrow(() -> new IllegalArgumentException("Expense not found"));
    expenseRepository.delete(e);
  }

  private void applyExpense(Expense e, ExpenseRequest req) {
    if (!CATEGORIES.contains(req.getCategory())) {
      throw new IllegalArgumentException("Invalid category");
    }
    e.setDate(LocalDate.parse(req.getDate()));
    e.setDescription(req.getDescription().trim());
    e.setCategory(req.getCategory());
    e.setAmount(req.getAmount());
  }

  private String displayName(String email, String name) {
    if (name != null && !name.trim().isEmpty()) {
      return name.trim();
    }
    String local = email.split("@")[0];
    String[] parts = local.split("[._-]+");
    StringBuilder sb = new StringBuilder();
    for (String p : parts) {
      if (p.isEmpty()) continue;
      if (sb.length() > 0) sb.append(' ');
      sb.append(Character.toUpperCase(p.charAt(0)));
      if (p.length() > 1) sb.append(p.substring(1));
    }
    return sb.length() == 0 ? "User" : sb.toString();
  }

  private Map<String, Object> toUserMap(User user) {
    Map<String, Object> m = new LinkedHashMap<String, Object>();
    m.put("id", String.valueOf(user.getId()));
    m.put("email", user.getEmail());
    m.put("name", user.getName());
    m.put("currency", user.getCurrency());
    m.put("monthlyBudget", user.getMonthlyBudget());
    m.put("budgetAlertsEnabled", user.isBudgetAlertsEnabled());
    m.put("shakeSensitivity", user.getShakeSensitivity());
    return m;
  }

  private Map<String, Object> toExpenseMap(Expense e) {
    Map<String, Object> m = new LinkedHashMap<String, Object>();
    m.put("rowId", e.getRowId());
    m.put("date", e.getDate().toString());
    m.put("description", e.getDescription());
    m.put("category", e.getCategory());
    m.put("amount", e.getAmount());
    m.put("createdAt", e.getCreatedAt().toString());
    return m;
  }
}
