package com.expensetracker.security;

import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.util.AuthUtil;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final UserRepository userRepository;

  public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
    this.jwtService = jwtService;
    this.userRepository = userRepository;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    if (HttpMethod.OPTIONS.matches(request.getMethod())) {
      return true;
    }
    String path = request.getRequestURI();
    if (!path.startsWith("/api/")) {
      return true;
    }
    return path.equals("/api/auth/login");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null || !header.startsWith("Bearer ")) {
      unauthorized(response, "Missing or invalid Authorization header");
      return;
    }

    String token = header.substring(7).trim();
    try {
      Long userId = jwtService.getUserId(token);
      User user = userRepository.findById(userId).orElse(null);
      if (user == null) {
        unauthorized(response, "User not found");
        return;
      }
      request.setAttribute(AuthUtil.CURRENT_USER_ATTR, user);
      filterChain.doFilter(request, response);
    } catch (Exception ex) {
      unauthorized(response, "Invalid or expired token");
    }
  }

  private void unauthorized(HttpServletResponse response, String message) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType("application/json");
    response.getWriter().write("{\"error\":\"" + message + "\"}");
  }
}
