<?php

namespace App\Auth\Application;

use App\Auth\Domain\AuthUser;

class DemoUserStore
{
    /**
     * @var array<string, array{id:string,email:string,name:string,password:string,role:string,employeeId:int}>
     */
    private array $users = [
        'alice@timesignal.demo' => [
            'id' => 'demo-user-alice',
            'email' => 'alice@timesignal.demo',
            'name' => 'Alice Janssen',
            'password' => 'User123!',
            'role' => 'user',
            'employeeId' => 1,
        ],
        'bob.admin@timesignal.demo' => [
            'id' => 'demo-admin-bob',
            'email' => 'bob.admin@timesignal.demo',
            'name' => 'Bob de Vries',
            'password' => 'Admin123!',
            'role' => 'admin',
            'employeeId' => 2,
        ],
    ];

    public function authenticate(string $email, string $password): ?AuthUser
    {
        $user = $this->users[strtolower(trim($email))] ?? null;

        if (!$user || $user['password'] !== $password) {
            return null;
        }

        return $this->hydrate($user);
    }

    public function findById(string $id): ?AuthUser
    {
        foreach ($this->users as $user) {
            if ($user['id'] === $id) {
                return $this->hydrate($user);
            }
        }

        return null;
    }

    private function hydrate(array $user): AuthUser
    {
        return new AuthUser(
            $user['id'],
            $user['email'],
            $user['name'],
            $user['role'],
            $user['employeeId'],
        );
    }
}
