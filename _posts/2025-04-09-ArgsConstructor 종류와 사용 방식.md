---
layout: post
title:  "ArgsConstructor 종류와 사용 방식"
categories: Article
---

# ArgsConstructor 종류와 사용 방식

### ArgsConstructor 종류 

- NoArgsConstructor
- AllArgsConstructor
- RequiredArgsConstructor

### 각 ArgsConstructor 사용 방식
```java
public class Member { // 예시 엔티티
    private String name;
    private int age;
}
```

#### NoArgsConstructor
**기본 생성자(파라미터 없는 생성자)** 를 생성한다.
```java
@NoArgsConstructor
public class Member {
    private String name;
    private int age;
}
// 생성자: public Member() {}
```

##### 언제 쓰나?

- JPA Entity 만들 때 **프록시 생성을 위해 기본 생성자 필요** → `@NoArgsConstructor` 필수
- 외부에서 빈 객체를 먼저 만들고 setter로 값 설정할 때



#### AllArgsConstructor

**모든 필드**를 인자로 받는 생성자를 생성한다.
```java
@AllArgsConstructor
public class Member {
    private String name;
    private int age;
}
// 생성자: public Member(String name, int age) {}
```

##### 언제 쓰나?
- 모든 필드 초기값을 한 번에 설정하고 싶을 때
- Builder 패턴 없이도 빠르게 객체 만들고 싶을 때



#### RequiredArgsConstructor

**`final`이나 `@NonNull`이 붙은 필드만** 인자로 받는 생성자를 생성한다.
``` java
@RequiredArgsConstructor
public class Member {
    private final String name;
    private int age;
}
// 생성자: public Member(String name) {}
```

##### 언제 쓰나?
- **불변 객체**를 만들 때 유용
- DI(의존성 주입)할 때 주로 사용 → 예: `Service` 클래스에서 `final`로 선언한 `Repository` 주입

### TIP:
- JPA Entity에는 꼭 `@NoArgsConstructor(access = AccessLevel.PROTECTED)` 같이 쓰는 걸 추천.
   → 외부에서는 생성 못 하게 하고, JPA만 내부적으로 쓸 수 있게 사용.