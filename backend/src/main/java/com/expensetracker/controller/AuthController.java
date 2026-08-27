package com.expensetracker.controller;

import com.expensetracker.dto.LoginRequest;
import com.expensetracker.dto.SettingsRequest;
import com.expensetracker.service.AppService;
import com.expensetracker.util.AuthUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AppService appService;

  public AuthController(AppService appService) {
    this.appService = appService;
  }

  @PostMapping("/login")
  public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
    return ResponseEntity.ok(appService.login(request));
  }

  @GetMapping("/me")
  public ResponseEntity<Map<String, Object>> me(HttpServletRequest request) {
    return ResponseEntity.ok(appService.me(AuthUtil.requireUser(request)));
  }

  @PutMapping("/settings")
  public ResponseEntity<Map<String, Object>> settings(
      HttpServletRequest request,
      @RequestBody SettingsRequest body
  ) {
    return ResponseEntity.ok(appService.updateSettings(AuthUtil.requireUser(request), body));
  }
}
