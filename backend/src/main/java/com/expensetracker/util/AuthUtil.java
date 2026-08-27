package com.expensetracker.util;

import com.expensetracker.model.User;

import javax.servlet.http.HttpServletRequest;

public final class AuthUtil {

  public static final String CURRENT_USER_ATTR = "currentUser";

  private AuthUtil() {
  }

  public static User requireUser(HttpServletRequest request) {
    Object attr = request.getAttribute(CURRENT_USER_ATTR);
    if (!(attr instanceof User)) {
      throw new IllegalStateException("Authenticated user required");
    }
    return (User) attr;
  }
}
