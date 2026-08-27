package com.expensetracker.controller;

import com.expensetracker.dto.ExpenseRequest;
import com.expensetracker.service.AppService;
import com.expensetracker.util.AuthUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

  private final AppService appService;

  public ExpenseController(AppService appService) {
    this.appService = appService;
  }

  @GetMapping
  public ResponseEntity<List<Map<String, Object>>> list(HttpServletRequest request) {
    return ResponseEntity.ok(appService.listExpenses(AuthUtil.requireUser(request)));
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> create(
      HttpServletRequest request,
      @Valid @RequestBody ExpenseRequest body
  ) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(appService.createExpense(AuthUtil.requireUser(request), body));
  }

  @PutMapping("/{id}")
  public ResponseEntity<Map<String, Object>> update(
      HttpServletRequest request,
      @PathVariable("id") String id,
      @Valid @RequestBody ExpenseRequest body
  ) {
    return ResponseEntity.ok(appService.updateExpense(AuthUtil.requireUser(request), id, body));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      HttpServletRequest request,
      @PathVariable("id") String id
  ) {
    appService.deleteExpense(AuthUtil.requireUser(request), id);
    return ResponseEntity.noContent().build();
  }
}
