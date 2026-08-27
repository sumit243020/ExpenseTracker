package com.expensetracker.controller;

import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping({"/", "/api/health"})
  public Map<String, String> health() {
    Map<String, String> body = new HashMap<String, String>();
    body.put("status", "ok");
    body.put("service", "expense-tracker-api");
    return body;
  }
}
