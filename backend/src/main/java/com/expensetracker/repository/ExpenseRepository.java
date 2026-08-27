package com.expensetracker.repository;

import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
  List<Expense> findByUserOrderByDateDescCreatedAtDesc(User user);

  Optional<Expense> findByRowIdAndUser(String rowId, User user);
}
